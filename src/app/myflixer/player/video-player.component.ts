import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

export type PlayerKind = 'auto' | 'mp4' | 'hls';

/** Fatal live network errors tolerated before the stream is declared over. */
const LIVE_MAX_RETRIES = 6;
/** …or this long spent failing, whichever comes first. */
const LIVE_GIVE_UP_MS  = 15000;
/** Continuous buffering on a live stream before we suspect it has stopped. */
const LIVE_STALL_MS    = 10000;
/**
 * Clean playback for this long means the next media error is a new incident, so
 * recovery restarts from the cheapest rung instead of the one it stopped at.
 */
const MEDIA_RECOVER_RESET_MS = 30000;

export interface QualityLevel {
  /** hls.js level index, or -1 for Auto */
  index:  number;
  label:  string;
  height: number;
}

export interface PlayerProgress {
  currentTime: number;
  duration:    number;
  percent:     number;
}

/**
 * Custom video player for MyFlixer.
 *
 * Replaces the browser's native controls with a Netflix-style control bar:
 * drag-scrub timeline with buffered range + hover preview, ±10s skip,
 * volume, playback rate, HLS quality switching, PiP, fullscreen, keyboard
 * shortcuts, mobile double-tap seek, and live-edge handling.
 *
 * hls.js is loaded with a dynamic import(), so it only lands in the bundle
 * as a lazy chunk fetched the first time an .m3u8 source is played. MP4
 * playback and Safari (native HLS) never download it.
 *
 * OnPush: every DOM/media listener is registered OUTSIDE the Angular zone so
 * `timeupdate` (~4Hz) and `pointermove` don't trigger app-wide change
 * detection. State updates therefore call `render()` (a throttled, guarded
 * detectChanges) rather than markForCheck — markForCheck would only queue a
 * check that nothing outside the zone will ever run.
 */
@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoPlayerComponent implements AfterViewInit, OnChanges, OnDestroy {
  // ── Inputs ────────────────────────────────────────────────────────────────
  @Input() src = '';
  @Input() kind: PlayerKind = 'auto';
  @Input() poster: string | null = null;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() autoplay = false;
  /** Resume position in seconds (Continue Watching). */
  @Input() startAt = 0;
  /** Live stream: hides duration, shows LIVE badge + GO LIVE when behind. */
  @Input() live = false;
  /**
   * The source really is LL-HLS (partial segments) — only our own MediaMTX
   * output is. Leave false for broadcaster feeds: see the hls.js config.
   */
  @Input() lowLatency = false;
  @Input() showBack = true;
  /** Offers a share control; the host page decides what sharing means. */
  @Input() canShare = false;
  /**
   * On a handset, go fullscreen-landscape as soon as the picture starts. Set
   * for live channels, where the page is nothing but the player and portrait
   * wastes two thirds of the screen. See enterLandscape() for what is and
   * isn't guaranteed.
   */
  @Input() forceLandscape = false;

  // ── Outputs ───────────────────────────────────────────────────────────────
  /** Throttled to once every 5s of playback — safe to persist straight to the API. */
  @Output() progress = new EventEmitter<PlayerProgress>();
  @Output() ended    = new EventEmitter<void>();
  @Output() back     = new EventEmitter<void>();
  /**
   * A live broadcast stopped for good — the manifest kept failing past the
   * point where it could plausibly be a hiccup. Distinct from `ended` (which
   * means a VOD played to its natural end) and from an error the viewer can
   * retry, so the host page can say "this stream has ended" instead of
   * spinning forever.
   */
  @Output() streamEnded = new EventEmitter<void>();
  /**
   * A live stream has been stuck buffering for a while. Not an error: when a
   * broadcaster stops, the media server keeps serving the last playlist for a
   * grace period, so playback simply stops advancing and hls.js reports
   * nothing at all. The host page should ask the server whether the channel is
   * still on air rather than let the spinner run.
   */
  @Output() stalled = new EventEmitter<void>();
  /** The viewer pressed share. */
  @Output() share = new EventEmitter<void>();

  @ViewChild('video',  { static: true }) private videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('scrub',  { static: false }) private scrubRef?: ElementRef<HTMLElement>;

  // ── View state (read by the template) ─────────────────────────────────────
  playing         = false;
  waiting         = true;
  muted           = false;
  volume          = 1;
  currentTime     = 0;
  duration        = 0;
  bufferedEnd     = 0;
  rate            = 1;
  levels: QualityLevel[] = [];
  currentLevel    = -1;      // -1 = auto
  autoLevelHeight = 0;       // height hls.js actually picked, for the "Auto (720p)" label
  controlsVisible = true;
  scrubbing       = false;
  hoverPercent: number | null = null;
  hoverTime       = 0;
  isFullscreen    = false;
  pipActive       = false;
  behindLive      = false;
  errorMessage    = '';
  /** The live broadcast is over — shown instead of the buffering spinner. */
  streamOver      = false;
  openMenu: 'rate' | 'quality' | null = null;

  readonly rates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  @HostBinding('tabindex') readonly tabindex = 0;
  @HostBinding('class.vp-hide-cursor')
  get hideCursor(): boolean { return !this.controlsVisible && this.playing; }

  private hls: any = null;
  private Hls: any = null;
  private hideTimer: any = null;
  private retryTimer: any = null;
  private stallTimer: any = null;
  /** Consecutive fatal network errors on a live stream, and when they started. */
  private liveErrorCount = 0;
  private liveErrorSince = 0;
  /**
   * How far up the media-recovery ladder we have climbed, and when we last
   * climbed it. Reset by a healthy fragment — see FRAG_LOADED.
   */
  private mediaRecoverStage = 0;
  private mediaRecoverAt    = 0;
  /**
   * True across the last recovery rung. Detaching hls.js raises an error on the
   * media element in its own right, and that must not be mistaken for the
   * stream failing while we are in the middle of rebuilding it.
   */
  private reattaching = false;
  /**
   * hls.js's own name for the last thing that went wrong, e.g.
   * 'bufferAddCodecError' or 'fragParsingError'. Kept from every ERROR event,
   * fatal or not, and appended to the message shown on screen: without it a
   * viewer can only report "it says format not supported", which covers half a
   * dozen unrelated causes and is not enough to diagnose one.
   */
  private lastHlsDetail = '';
  private lastRender = 0;
  private lastProgressEmit = 0;
  private lastTapAt = 0;
  private destroyed = false;
  private viewReady = false;
  private detachFns: Array<() => void> = [];

  constructor(
    private host: ElementRef<HTMLElement>,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const v = this.video;
      this.on(v, 'loadedmetadata', () => {
        this.duration = isFinite(v.duration) ? v.duration : 0;
        if (this.startAt > 0 && this.startAt < this.duration - 5) v.currentTime = this.startAt;
        this.setWaiting(false);
        this.render(true);
      });
      this.on(v, 'timeupdate',   () => this.onTimeUpdate());
      this.on(v, 'progress',     () => { this.readBuffered(); this.render(); });
      this.on(v, 'play',         () => {
        this.resyncLiveIfStale();
        this.playing = true;  this.setWaiting(false); this.scheduleHide(); this.render(true);
      });
      this.on(v, 'pause',        () => { this.playing = false; this.showControls();  this.render(true); });
      this.on(v, 'waiting',      () => { this.setWaiting(true);  this.render(true); });
      this.on(v, 'playing',      () => { this.setWaiting(false); this.render(true); this.maybeLandscape(); });
      this.on(v, 'volumechange', () => {
        this.volume = v.volume;
        this.muted  = v.muted;
        this.render(true);
      });
      this.on(v, 'ratechange',   () => { this.rate = v.playbackRate; this.render(true); });
      this.on(v, 'ended',        () => {
        this.playing = false;
        this.showControls();
        this.render(true);
        this.zone.run(() => this.ended.emit());
      });
      // While hls.js is driving the element through MSE, a media element error
      // is usually a recoverable append/decode failure at a segment boundary,
      // NOT a dead source — tearing the player down here is what forced the
      // viewer to back out and reopen the channel. Let the ladder try first.
      this.on(v, 'error', () => {
        if (this.reattaching) return;
        if (this.hls && this.recoverMedia()) return;
        this.fail(this.mediaErrorText(v.error));
      });
      this.on(v, 'enterpictureinpicture', () => { this.pipActive = true;  this.render(true); });
      this.on(v, 'leavepictureinpicture', () => { this.pipActive = false; this.render(true); });

      const h = this.host.nativeElement;
      this.on(h, 'pointermove', (e) => {
        // Touch drags also raise pointermove; only a real cursor should count
        // as "the viewer is looking around", otherwise every tap-drag fights
        // the auto-hide timer.
        if ((e as PointerEvent).pointerType === 'mouse') this.showControls();
      });
      this.on(h, 'pointerleave', (e) => {
        // Touch pointers are destroyed on lift, which fires pointerleave — so
        // an unguarded hide here made the controls vanish the instant you
        // tapped to reveal them. Only a mouse genuinely leaves the player.
        if ((e as PointerEvent).pointerType !== 'mouse') return;
        if (this.playing) this.hideControls();
      });
      this.on(document, 'fullscreenchange', () => {
        this.isFullscreen = document.fullscreenElement === h;
        // Leaving fullscreen must release the orientation lock too, or the
        // whole app stays pinned to landscape after the viewer backs out.
        if (!this.isFullscreen) this.unlockOrientation();
        this.render(true);
      });
    });

    this.viewReady = true;

    // Keyboard shortcuts are host-scoped (so they never hijack the rest of the
    // page), which means they only fire once focus is inside the player. On a
    // fresh page load focus sits on <body>, so f / k / m / arrows did nothing
    // until you happened to click a control first. Claim it up front.
    this.host.nativeElement.focus({ preventScroll: true });

    this.attachSource();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] && !changes['src'].firstChange) this.attachSource();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    clearTimeout(this.hideTimer);
    clearTimeout(this.retryTimer);
    clearTimeout(this.stallTimer);
    this.detachFns.forEach(fn => fn());
    this.detachFns = [];
    this.detachLandscapeRetry?.();
    this.detachLandscapeRetry = null;
    // Navigating away while locked would leave the rest of the app landscape.
    this.unlockOrientation();
    this.teardownHls();
    const v = this.video;
    v.pause();
    v.removeAttribute('src');
    v.load();
  }

  // ── Source attachment ─────────────────────────────────────────────────────
  private async attachSource(): Promise<void> {
    const v = this.video;
    this.teardownHls();
    this.errorMessage   = '';
    this.lastHlsDetail  = '';
    this.streamOver     = false;
    this.liveErrorCount = 0;
    this.liveErrorSince = 0;
    this.levels = [];
    this.currentLevel = -1;
    this.setWaiting(true);
    this.render(true);

    if (!this.src) return;

    const isHls = this.kind === 'hls'
      || (this.kind === 'auto' && /\.m3u8(\?|#|$)/i.test(this.src));

    // Plain progressive file: nothing to negotiate.
    if (!isHls) {
      v.src = this.src;
      v.load();
      if (this.autoplay) this.tryAutoplay();
      return;
    }

    try {
      const mod = await import('hls.js');
      if (this.destroyed) return;
      const Hls = (mod as any).default ?? mod;
      this.Hls = Hls;

      // hls.js wherever Media Source Extensions exist, and native HLS only as
      // the fallback when they do not.
      //
      // This used to be the other way round — native was preferred whenever
      // canPlayType() said the browser could handle a manifest. That test is
      // not trustworthy: ANDROID CHROME ANSWERS "maybe" AND THEN PLAYS HLS
      // BADLY, so on the platform most of our viewers are using, hls.js was
      // being skipped entirely. Channels with simple ladders survived it;
      // anything with several codec variants or redirecting segments did not,
      // and none of hls.js's error recovery could help because hls.js was
      // never attached.
      //
      // The cost is that Safari now goes through MSE too, losing native
      // AirPlay and some hardware decoding. iOS keeps the native path
      // regardless, because iPhones have no MSE and isSupported() is false
      // there — which is where that advantage actually mattered.
      if (!Hls.isSupported()) {
        if (v.canPlayType('application/vnd.apple.mpegurl')) {
          v.src = this.src;
          v.load();
          if (this.autoplay) this.tryAutoplay();
          return;
        }
        this.fail('This browser cannot play HLS streams.');
        return;
      }

      this.zone.runOutsideAngular(() => {
        const hls = new Hls({
          enableWorker:     true,
          // Low-latency mode only for streams that are actually LL-HLS — our own
          // MediaMTX output. Turning it on for ordinary live HLS makes hls.js
          // ride the live edge, so any late segment starves the buffer and
          // stalls; third-party FAST channels ship 6-10s segments and cannot
          // sustain that. See the lowLatency input.
          lowLatencyMode:   this.lowLatency,
          backBufferLength: this.live ? 30 : 90,
          // Sit a few segments behind the edge on ordinary live streams — the
          // headroom a jittery CDN needs to not stall on one slow fragment.
          ...(this.live && !this.lowLatency ? {
            liveSyncDurationCount:      3,
            liveMaxLatencyDurationCount: 12,
            maxBufferLength:            30,
          } : {}),
        });
        this.hls = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, (_e: any, data: any) => {
          this.levels = (data.levels || [])
            .map((l: any, i: number) => ({
              index:  i,
              height: l.height || 0,
              label:  l.height ? `${l.height}p` : `${Math.round((l.bitrate || 0) / 1000)}kbps`,
            }))
            .sort((a: QualityLevel, b: QualityLevel) => b.height - a.height);
          this.render(true);
          if (this.autoplay) this.tryAutoplay();
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_e: any, data: any) => {
          this.autoLevelHeight = hls.levels?.[data.level]?.height || 0;
          this.render(true);
        });

        // A healthy fragment means whatever went wrong before has passed.
        hls.on(Hls.Events.FRAG_LOADED, () => {
          this.liveErrorCount    = 0;
          this.liveErrorSince    = 0;
          this.mediaRecoverStage = 0;
          this.mediaRecoverAt    = 0;
        });

        hls.on(Hls.Events.ERROR, (_e: any, data: any) => {
          // Recorded even when non-fatal: the detail that explains a failure is
          // often reported moments before the error that actually kills it.
          if (data?.details) this.lastHlsDetail = String(data.details);
          if (!data.fatal) return;
          // Live streams drop segments constantly — recover in place rather
          // than tearing the player down on the first hiccup.
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (this.live && this.liveGaveUp()) {
                // The broadcaster stopped: the media server removes the path,
                // so the manifest 404s forever. Retrying here is what used to
                // leave the spinner running indefinitely.
                this.endLive();
              } else {
                // Back off instead of hammering a server that just failed.
                this.retryTimer = setTimeout(() => {
                  if (!this.destroyed && this.hls === hls) hls.startLoad();
                }, 1000);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              if (!this.recoverMedia()) this.fail('This stream could not be played.');
              break;
            default: this.fail('This stream could not be played.');
          }
        });

        hls.loadSource(this.src);
        hls.attachMedia(v);
      });
    } catch {
      this.fail('Could not load the video engine.');
    }
  }

  private teardownHls(): void {
    if (this.hls) {
      try { this.hls.destroy(); } catch { /* already gone */ }
      this.hls = null;
    }
  }

  private tryAutoplay(): void {
    // Autoplay with sound is blocked by every browser unless the user has
    // already interacted; fall back to muted rather than silently not playing.
    this.video.play().catch(() => {
      this.video.muted = true;
      this.video.play().catch(() => { /* user will press play */ });
    });
  }

  // ── Playback controls ─────────────────────────────────────────────────────
  togglePlay(): void {
    const v = this.video;
    if (v.paused || v.ended) { v.play().catch(() => { /* ignore */ }); } else { v.pause(); }
    this.showControls();
  }

  skip(seconds: number): void {
    const v = this.video;
    const max = this.windowEnd() || v.duration || 0;
    v.currentTime = Math.max(this.windowStart(), Math.min(max, v.currentTime + seconds));
    this.showControls();
  }

  seekToPercent(percent: number): void {
    const span = this.timelineDuration();
    if (!span) return;
    this.video.currentTime = this.windowStart() + (percent / 100) * span;
  }

  goLive(): void {
    const end = this.seekableEnd();
    if (end) this.video.currentTime = end - 0.5;
    if (this.video.paused) this.video.play().catch(() => { /* ignore */ });
  }

  toggleMute(): void {
    const v = this.video;
    v.muted = !v.muted;
    if (!v.muted && v.volume === 0) v.volume = 0.5;
    this.showControls();
  }

  onVolumeInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const v = this.video;
    v.volume = value;
    v.muted  = value === 0;
  }

  setRate(rate: number): void {
    this.video.playbackRate = rate;
    this.openMenu = null;
    this.render(true);
  }

  setLevel(index: number): void {
    this.currentLevel = index;
    if (this.hls) this.hls.currentLevel = index;   // -1 restores ABR
    this.openMenu = null;
    this.render(true);
  }

  toggleMenu(menu: 'rate' | 'quality'): void {
    this.openMenu = this.openMenu === menu ? null : menu;
    this.showControls();
    this.render(true);
  }

  async toggleFullscreen(): Promise<void> {
    const h = this.host.nativeElement as any;
    try {
      if (document.fullscreenElement === h) {
        await document.exitFullscreen();
      } else if (h.requestFullscreen) {
        await h.requestFullscreen();
      } else if ((this.video as any).webkitEnterFullscreen) {
        // iPhone Safari cannot fullscreen an arbitrary element — only the
        // video itself, which means native controls take over on that device.
        (this.video as any).webkitEnterFullscreen();
      }
    } catch { /* user denied or unsupported */ }
  }

  // ── Mobile: fullscreen landscape for live ─────────────────────────────────

  /** Only once per source — if the viewer backs out, respect that. */
  private landscapeDone = false;
  private detachLandscapeRetry: (() => void) | null = null;

  /** A phone-sized touch screen, not a desktop with a touchscreen monitor. */
  private isHandset(): boolean {
    return window.matchMedia('(pointer: coarse)').matches
        && Math.min(window.innerWidth, window.innerHeight) < 820;
  }

  private maybeLandscape(): void {
    if (!this.forceLandscape || this.landscapeDone || !this.isHandset()) return;
    this.enterLandscape();
  }

  /**
   * Go fullscreen and pin to landscape. Both halves are best-effort:
   *
   *   - requestFullscreen needs transient user activation. The tap that opened
   *     the channel usually still counts (Chromium keeps activation alive for
   *     a few seconds), but if the manifest was slow to resolve it has expired
   *     — hence the retry armed on the next touch.
   *   - screen.orientation.lock is Chromium-only and only works while
   *     fullscreen. iOS Safari has neither API, and cannot fullscreen an
   *     arbitrary element at all; there the video's own native fullscreen is
   *     the best available, and iOS rotates that by itself.
   */
  private async enterLandscape(): Promise<void> {
    const h = this.host.nativeElement as any;
    const v = this.video as any;

    if (!h.requestFullscreen) {
      if (v.webkitEnterFullscreen) {
        v.webkitEnterFullscreen();     // iPhone handles the rotation itself
        this.landscapeDone = true;
      }
      return;
    }

    try {
      await h.requestFullscreen({ navigationUI: 'hide' });
    } catch {
      this.armLandscapeRetry();        // no activation left — wait for a touch
      return;
    }

    this.landscapeDone = true;
    try {
      await (screen as any).orientation?.lock?.('landscape');
    } catch {
      // Unsupported, or the device is orientation-locked in settings. The
      // viewer still gets fullscreen, just in portrait.
    }
  }

  private armLandscapeRetry(): void {
    if (this.detachLandscapeRetry) return;
    const h = this.host.nativeElement;
    const once = () => {
      this.detachLandscapeRetry = null;
      this.enterLandscape();
    };
    h.addEventListener('pointerdown', once, { once: true });
    this.detachLandscapeRetry = () => h.removeEventListener('pointerdown', once);
  }

  private unlockOrientation(): void {
    try { (screen as any).orientation?.unlock?.(); } catch { /* unsupported */ }
  }

  async togglePip(): Promise<void> {
    const v = this.video as any;
    try {
      if ((document as any).pictureInPictureElement) {
        await (document as any).exitPictureInPicture();
      } else if (v.requestPictureInPicture) {
        await v.requestPictureInPicture();
      }
    } catch { /* unsupported */ }
  }

  get pipSupported(): boolean {
    return !!(document as any).pictureInPictureEnabled;
  }

  // ── Timeline (drag + hover preview) ───────────────────────────────────────
  onScrubDown(event: PointerEvent): void {
    if (!this.scrubRef) return;
    this.scrubbing = true;
    this.scrubRef.nativeElement.setPointerCapture(event.pointerId);
    this.seekToPercent(this.percentFromEvent(event));
    this.render(true);
  }

  onScrubMove(event: PointerEvent): void {
    const percent = this.percentFromEvent(event);
    this.hoverPercent = percent;
    this.hoverTime = (percent / 100) * this.timelineDuration();
    if (this.scrubbing) this.seekToPercent(percent);
    this.render();
  }

  onScrubUp(event: PointerEvent): void {
    if (!this.scrubbing || !this.scrubRef) return;
    this.scrubbing = false;
    try { this.scrubRef.nativeElement.releasePointerCapture(event.pointerId); } catch { /* noop */ }
    this.render(true);
  }

  onScrubLeave(): void {
    this.hoverPercent = null;
    this.render(true);
  }

  private percentFromEvent(event: PointerEvent): number {
    const el = this.scrubRef?.nativeElement;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
  }

  /** Tapping the video toggles controls; a quick second tap seeks ±10s. */
  onSurfaceTap(event: PointerEvent): void {
    // <video> isn't focusable, so a click on it leaves focus wherever it was —
    // outside the player, where the keyboard shortcuts can't see it.
    this.host.nativeElement.focus({ preventScroll: true });
    if (event.pointerType === 'mouse') { this.togglePlay(); return; }
    const now = Date.now();
    if (now - this.lastTapAt < 300) {
      const rect = this.host.nativeElement.getBoundingClientRect();
      this.skip(event.clientX - rect.left < rect.width / 2 ? -10 : 10);
      this.lastTapAt = 0;
      return;
    }
    this.lastTapAt = now;
    this.controlsVisible ? this.hideControls() : this.showControls();
  }

  // ── Keyboard (host-scoped so it never hijacks the rest of the page) ───────
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const key = event.key;
    const target = event.target as HTMLElement;
    if (target?.tagName === 'INPUT' && key !== 'Escape') return;

    let handled = true;
    switch (key) {
      case ' ': case 'k':            this.togglePlay(); break;
      case 'ArrowLeft':              this.skip(-5);  break;
      case 'ArrowRight':             this.skip(5);   break;
      case 'j':                      this.skip(-10); break;
      case 'l':                      this.skip(10);  break;
      case 'ArrowUp':                this.nudgeVolume(0.05);  break;
      case 'ArrowDown':              this.nudgeVolume(-0.05); break;
      case 'm':                      this.toggleMute(); break;
      case 'f':                      this.toggleFullscreen(); break;
      case 'p':                      this.togglePip(); break;
      case 'Escape':                 this.openMenu = null; break;
      default:
        if (/^[0-9]$/.test(key)) { this.seekToPercent(Number(key) * 10); }
        else { handled = false; }
    }
    if (handled) {
      event.preventDefault();
      this.showControls();
      this.render(true);
    }
  }

  private nudgeVolume(delta: number): void {
    const v = this.video;
    v.volume = Math.max(0, Math.min(1, v.volume + delta));
    v.muted = v.volume === 0;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.openMenu) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.openMenu = null;
      this.render(true);
    }
  }

  // ── Controls visibility ───────────────────────────────────────────────────
  showControls(): void {
    const wasHidden = !this.controlsVisible;
    this.controlsVisible = true;
    this.scheduleHide();
    if (wasHidden) this.render(true);
  }

  private hideControls(): void {
    if (this.openMenu || this.scrubbing) return;
    this.controlsVisible = false;
    this.render(true);
  }

  private scheduleHide(): void {
    clearTimeout(this.hideTimer);
    if (!this.playing) return;
    // Outside the zone so an idle player doesn't wake change detection every 2.8s.
    this.zone.runOutsideAngular(() => {
      this.hideTimer = setTimeout(() => this.hideControls(), 2800);
    });
  }

  // ── Derived values used by the template ───────────────────────────────────
  /**
   * The timeline covers [0, duration] for VOD. Live streams report Infinity
   * for duration and their seekable range slides forward, so the window is the
   * DVR range instead — and it does not start at 0 once the stream has been
   * running longer than the retained buffer.
   */
  private windowStart(): number { return this.live ? this.seekableStart() : 0; }
  private windowEnd():   number { return this.live ? this.seekableEnd()   : this.duration; }

  timelineDuration(): number {
    return Math.max(0, this.windowEnd() - this.windowStart());
  }

  get playedPercent(): number {
    const span = this.timelineDuration();
    if (!span) return 0;
    return Math.max(0, Math.min(100, ((this.currentTime - this.windowStart()) / span) * 100));
  }

  get bufferedPercent(): number {
    const span = this.timelineDuration();
    if (!span) return 0;
    return Math.max(0, Math.min(100, ((this.bufferedEnd - this.windowStart()) / span) * 100));
  }

  get qualityLabel(): string {
    if (this.currentLevel === -1) {
      return this.autoLevelHeight ? `Auto (${this.autoLevelHeight}p)` : 'Auto';
    }
    return this.levels.find(l => l.index === this.currentLevel)?.label ?? 'Auto';
  }

  get remainingLabel(): string {
    const total = this.timelineDuration();
    return total ? `-${this.formatTime(total - this.currentTime)}` : '';
  }

  formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const s = Math.floor(seconds % 60);
    const m = Math.floor((seconds / 60) % 60);
    const h = Math.floor(seconds / 3600);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }

  retry(): void {
    this.errorMessage = '';
    // An explicit retry is a fresh start, so the ladder begins from the bottom.
    this.mediaRecoverStage = 0;
    this.mediaRecoverAt    = 0;
    this.attachSource();
  }

  emitBack(): void { this.back.emit(); }

  // ── Internals ─────────────────────────────────────────────────────────────
  private get video(): HTMLVideoElement { return this.videoRef.nativeElement; }

  private seekableEnd(): number {
    const v = this.video;
    return v.seekable.length ? v.seekable.end(v.seekable.length - 1) : 0;
  }

  private seekableStart(): number {
    const v = this.video;
    return v.seekable.length ? v.seekable.start(0) : 0;
  }

  private onTimeUpdate(): void {
    const v = this.video;
    this.currentTime = v.currentTime;
    if (!this.duration && isFinite(v.duration)) this.duration = v.duration;
    this.readBuffered();

    if (this.live) {
      const end = this.seekableEnd();
      this.behindLive = end > 0 && end - v.currentTime > 12;
    }

    const now = Date.now();
    if (now - this.lastProgressEmit > 5000 && this.playing) {
      this.lastProgressEmit = now;
      const duration = this.duration;
      this.zone.run(() => this.progress.emit({
        currentTime: v.currentTime,
        duration,
        percent: duration ? (v.currentTime / duration) * 100 : 0,
      }));
    }
    this.render();
  }

  private readBuffered(): void {
    const v = this.video;
    let end = 0;
    for (let i = 0; i < v.buffered.length; i++) {
      if (v.buffered.start(i) <= v.currentTime && v.buffered.end(i) >= v.currentTime) {
        end = v.buffered.end(i);
        break;
      }
    }
    this.bufferedEnd = end;
  }

  /**
   * True once fatal network errors have persisted long enough that the stream
   * is gone rather than stuttering. Both a count and a time window, because a
   * fast-failing manifest burns through retries in under a second while a
   * slow-timing-out one barely increments the counter.
   */
  private liveGaveUp(): boolean {
    const now = Date.now();
    if (!this.liveErrorSince) this.liveErrorSince = now;
    this.liveErrorCount++;
    return this.liveErrorCount >= LIVE_MAX_RETRIES
        || now - this.liveErrorSince >= LIVE_GIVE_UP_MS;
  }

  /**
   * Climb the media-recovery ladder one rung. Returns false once every rung has
   * been tried, at which point the caller should surface a real error.
   *
   * FAST channels splice ads and programme blocks into the feed, and the
   * spliced-in segments are frequently encoded slightly differently from the
   * ones around them — most often a different audio profile. At that boundary
   * the browser rejects the append and raises a decode / src-not-supported
   * error, which is why playback dies a little while after it started and comes
   * back if you reopen the channel: reopening rebuilds the source buffers with
   * the codec that is current at that moment.
   *
   * hls.js exposes exactly this escalation, and the audio-codec swap is the
   * rung that matters for splices — recoverMediaError() alone rebuilds the
   * buffer with the SAME codec, so on a genuine codec change it fails again
   * immediately. The last rung reattaches from scratch, which is what the
   * viewer was doing by hand.
   */
  private recoverMedia(): boolean {
    const hls = this.hls;
    if (!hls || this.destroyed || this.streamOver) return false;

    const now = Date.now();
    // A failure long after the previous one is a fresh incident, not the ladder
    // failing to hold — start again from the cheapest rung.
    if (this.mediaRecoverAt && now - this.mediaRecoverAt > MEDIA_RECOVER_RESET_MS) {
      this.mediaRecoverStage = 0;
    }
    this.mediaRecoverAt = now;

    switch (this.mediaRecoverStage++) {
      case 0:
        hls.recoverMediaError();
        return true;
      case 1:
        // The splice changed audio codec: rebuild the buffers with the other one.
        try { hls.swapAudioCodec(); } catch { /* older hls.js builds */ }
        hls.recoverMediaError();
        return true;
      case 2:
        // Full reattach — equivalent to backing out and reopening the channel,
        // minus the navigation. Live streams resume at the edge on their own.
        this.reattaching = true;
        this.teardownHls();
        this.attachSource().finally(() => { this.reattaching = false; });
        return true;
      default:
        return false;
    }
  }

  /**
   * Called when playback resumes. hls.js stops fetching once the forward buffer
   * is full, so a pause longer than that buffer leaves currentTime pointing at
   * a moment the broadcaster has already dropped from its sliding-window
   * playlist — the resumed fetch 404s and the stream dies.
   *
   * Inside the buffered margin we resume exactly where the viewer paused. Past
   * it, there is nothing to resume to, so we jump to the live edge.
   */
  private resyncLiveIfStale(): void {
    const hls = this.hls;
    if (!hls || !this.live || this.streamOver) return;

    const v = this.video;
    const t = v.currentTime;
    for (let i = 0; i < v.buffered.length; i++) {
      // Still inside cached content: resume in place, no seek.
      if (t >= v.buffered.start(i) && t <= v.buffered.end(i)) return;
    }

    const edge = hls.liveSyncPosition;
    if (typeof edge === 'number' && isFinite(edge) && edge > t) v.currentTime = edge;
  }

  /** The broadcast is over — stop the spinner and tell the host page. */
  private endLive(): void {
    this.teardownHls();
    this.streamOver   = true;
    this.setWaiting(false);
    this.playing      = false;
    this.errorMessage = '';
    this.showControls();
    this.render(true);
    this.zone.run(() => this.streamEnded.emit());
  }

  /**
   * Single point of truth for the buffering flag, so the live-stall watchdog is
   * always armed exactly while the player is actually stuck.
   */
  private setWaiting(value: boolean): void {
    this.waiting = value;
    clearTimeout(this.stallTimer);
    if (!value || !this.live || this.streamOver) return;

    this.zone.runOutsideAngular(() => {
      this.stallTimer = setTimeout(() => {
        if (this.destroyed || !this.waiting) return;
        // Re-arm: the host may decide this is ordinary buffering, in which case
        // we keep checking rather than asking once and giving up.
        this.setWaiting(true);
        this.zone.run(() => this.stalled.emit());
      }, LIVE_STALL_MS);
    });
  }

  private fail(message: string): void {
    this.teardownHls();
    // The detail is deliberately shown rather than only logged: on a phone
    // nobody can open a console, so this is the only way a viewer can tell us
    // which failure they actually hit.
    this.errorMessage = this.lastHlsDetail ? `${message} (${this.lastHlsDetail})` : message;
    this.setWaiting(false);
    this.showControls();
    this.render(true);
  }

  private mediaErrorText(error: MediaError | null): string {
    switch (error?.code) {
      case MediaError.MEDIA_ERR_NETWORK:      return 'Network error — the video stopped loading.';
      case MediaError.MEDIA_ERR_DECODE:       return 'This video could not be decoded.';
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        return 'This video format is not supported, or the source blocked the request.';
      default:                                return 'Something went wrong playing this video.';
    }
  }

  private on(target: EventTarget, type: string, handler: EventListener): void {
    target.addEventListener(type, handler);
    this.detachFns.push(() => target.removeEventListener(type, handler));
  }

  /**
   * Change detection for an OnPush component whose listeners live outside the
   * zone. `force` bypasses the 100ms throttle for discrete state changes;
   * high-frequency callers (timeupdate, pointermove) leave it off.
   */
  private render(force = false): void {
    // Skipping until AfterViewInit has finished keeps detectChanges() out of
    // the parent's in-flight change-detection pass.
    if (this.destroyed || !this.viewReady) return;
    const now = Date.now();
    if (!force && now - this.lastRender < 100) return;
    this.lastRender = now;
    this.cdr.detectChanges();
  }
}
