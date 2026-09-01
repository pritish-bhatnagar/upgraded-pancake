import { Component, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, HostListener, ViewChild, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/tv-network/shared/auth.service';
import { ViewingProfileService, ViewingProfile } from './shared/viewing-profile.service';



// Bootstrap's JS is loaded globally by angular.json ("scripts": bootstrap.bundle.min.js).
// Importing the npm module here as well would load a SECOND copy, and both copies
// register the same delegated data-API click handlers — every click on a
// [data-bs-toggle] element would fire twice (open then immediately close).
declare const bootstrap: any;

type Show = {
  id: string;
  title: string;
  subtitle?: string;
  tag?: string;           // e.g., "New", "Live", "Exclusive"
  img: string;            // full URL or assets path

  // Fields the /api/v1/home rails actually send (see backend domain/home.ts).
  contentId?: string;
  description?: string;
  posterUrl?: string;
  heroImageUrl?: string | null;
  trailerUrl?: string | null;
  streamUrl?: string | null;   // null → not playable, so no Play affordance
  genres?: string[];
  releaseYear?: number;
  maturityRating?: string;
  durationSeconds?: number;
  badgeLabel?: string | null;
  progressPercent?: number | null;
};

/** A single row on the home page. Mirrors HomeRail in the backend domain. */
type Rail = {
  railId:   string;
  railKey:  string;
  title:    string | null;
  railType: 'hero' | 'standard' | 'continue_watching' | 'top_ten' | 'my_list';
  items:    Show[];
};


@Component({
  selector: 'app-myflixer',
  templateUrl: './myflixer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./myflixer.component.scss']
})
export class MyflixerComponent implements OnInit, AfterViewInit, OnDestroy {
  private API = 'http://161.118.182.124:3000';
  private carouselInstance: any = null;
  private hoverTimers: Map<number, ReturnType<typeof setTimeout>> = new Map();
  private readonly TRAILER_DELAY_MS = 1200; 
  // activeIndex = 0;
  trailerActiveIndex: number | null = null;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private profileService: ViewingProfileService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  loading = true;

  isLoggedIn = !!localStorage.getItem('auth_token');
  userEmail: string | null = null;
  displayName: string | null = null;

  // Viewing profiles (Netflix "who's watching")
  activeProfile: ViewingProfile | null = null;
  profiles: ViewingProfile[] = [];

  // Mobile chrome: bottom tabs + the sheets they open.
  moreOpen = false;
  searchOpen = false;
  readonly categories = ['Home', 'Series', 'Films', 'Live', 'News', 'Sports', 'Kids', 'Originals', 'My List'];
  readonly skeletonCards = [1, 2, 3, 4, 5, 6];

  trending: any[] = [];

  topPicks: any[] = [];

  responsiveOptions = [
    { breakpoint: '1024px', numVisible: 4, numScroll: 4 },
    { breakpoint: '768px', numVisible: 2, numScroll: 2 },
    { breakpoint: '560px', numVisible: 1, numScroll: 1 }
  ];

  ngOnInit() {

    this.authService.onAuthStateChanged((user) => {
      this.isLoggedIn = !!user;
      this.userEmail = user?.email ?? null;
      if (user) {
        this.loadProfile();
        this.loadViewingProfiles();
      } else {
        this.displayName = null;
        this.profiles = [];
      }
      this.cdr.markForCheck();
    });

    // Track the currently-selected viewing profile for the nav avatar.
    this.profileService.active$.subscribe((p) => {
      this.activeProfile = p;
      this.cdr.markForCheck();
    });

    this.loadHome();
  }

  /**
   * Pulls the home page. The rail list is rendered generically, in the order
   * the API sends it — only the hero is lifted out, because it's the billboard
   * rather than a row. A new backend rail therefore needs no change here.
   */
  private loadHome(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.http.get<any>(`${this.API}/api/v1/home?region=IN`).subscribe({
      next: ({ rails = [] }) => {
        this.heroSlides = rails.find((r: any) => r.railType === 'hero')?.items ?? [];
        this.rails      = rails.filter((r: any) => r.railType !== 'hero' && r.items?.length);

        this.loading = false;

        // OnPush: without this the rails stay empty until some unrelated event
        // (e.g. the scroll HostListener) happens to mark the view dirty.
        this.cdr.markForCheck();

        // The carousel was built in ngAfterViewInit while there were still no
        // slides, so start the progress bar now that the first one exists.
        setTimeout(() => this.startActiveProgressBar());
      },
      error: () => {
        this.heroSlides = [];
        this.rails = [];
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  scrolled = false;

  carouselInterval = 6000;
  activeIndex = 0;

  @ViewChild('heroCarousel', { static: true })
  heroCarouselRef!: ElementRef<HTMLElement>;

  heroSlides: Show[] = [];

  /** Every non-hero rail from /api/v1/home, rendered in the order given. */
  rails: Rail[] = [];

  /** Title whose details modal is open, or null. */
  infoItem: Show | null = null;

  /** Live channel guide overlay. */

  trackByRail = (_: number, rail: Rail) => rail.railId;
  trackByItem = (_: number, item: Show) => item.contentId ?? item.id;

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled = (window?.scrollY || 0) > 12;
  }

  ngAfterViewInit(): void {
    const el = this.heroCarouselRef?.nativeElement;
    if (!el) return;

    this.carouselInstance = new bootstrap.Carousel(el, { interval: 5000, ride: 'carousel' });

    el.addEventListener('slide.bs.carousel' as any, (e: any) => {
      this.resetAllProgressBars();
      this.activeIndex = e.to ?? 0;
      // Native listener, so OnPush needs telling — otherwise the active
      // indicator never moves off the first slide.
      this.cdr.markForCheck();
    });

    el.addEventListener('slid.bs.carousel' as any, (e: any) => {
      this.activeIndex = e.to ?? this.activeIndex;
      this.startActiveProgressBar();
      this.cdr.markForCheck();
    });

    setTimeout(() => this.startActiveProgressBar());
  }

  private resetAllProgressBars() {
    const bars = this.heroCarouselRef.nativeElement.querySelectorAll<
      HTMLElement
    >('.progress-indicator .progress-bar');
    bars.forEach((b) => {
      b.style.animation = 'none';
      void b.offsetHeight; // force reflow
    });
  }

  private startActiveProgressBar() {
    const activeBar = this.heroCarouselRef.nativeElement.querySelectorAll<
      HTMLElement
    >('.progress-indicator .progress-bar')[this.activeIndex];
    if (activeBar) {
      activeBar.style.animation = `fill var(--dur, ${this.carouselInterval}ms) linear forwards`;
    }
  }

  onCarouselHover(entering: boolean) {
    if (entering) {
      this.carouselInstance?.pause();
    } else {
      // Only resume if no trailer is playing
      if (this.trailerActiveIndex === null) {
        this.carouselInstance?.cycle();
      }
    }
  }

  /** Per-slide hover: wait TRAILER_DELAY_MS, then swap poster → trailer */
  onSlideHover(index: number, entering: boolean) {
    if (entering) {
      const timer = setTimeout(() => {
        this.trailerActiveIndex = index;
      }, this.TRAILER_DELAY_MS);
      this.hoverTimers.set(index, timer);
    } else {
      // Cancel the pending timer if user moves away quickly
      const timer = this.hoverTimers.get(index);
      if (timer) {
        clearTimeout(timer);
        this.hoverTimers.delete(index);
      }
      this.trailerActiveIndex = null;
      // Resume carousel once trailer is dismissed
      this.carouselInstance?.cycle();
    }
  }

  /** A title is playable once the catalog has a feature stream attached. */
  isPlayable(item: Show): boolean {
    return !!(item?.streamUrl && (item.contentId || item.id));
  }

  /** Open the watch page. The player resolves the stream itself from the id. */
  play(item: Show, event?: Event): void {
    event?.stopPropagation();
    if (!this.isPlayable(item)) return;
    this.router.navigate(['/myflixer/watch', item.contentId ?? item.id]);
  }

  /** Continue Watching bar — the backend pre-computes the percentage. */
  progressWidth(item: Show): string {
    const percent = item?.progressPercent ?? 0;
    return `${Math.min(100, Math.max(0, percent))}%`;
  }

  /** "2010 · 2h 28m · Sci-Fi, Thriller" — whichever of those the item has. */
  metaLine(item: Show): string {
    const parts: string[] = [];
    if (item?.releaseYear) parts.push(String(item.releaseYear));
    if (item?.maturityRating) parts.push(item.maturityRating);
    const runtime = this.runtime(item);
    if (runtime) parts.push(runtime);
    if (item?.genres?.length) parts.push(item.genres.slice(0, 2).join(', '));
    return parts.join(' · ');
  }

  /**
   * Scrolls a rail by just under one viewport of cards, so the card at the
   * edge stays partly visible and the eye keeps its place.
   */
  scrollRail(track: HTMLElement, direction: 1 | -1): void {
    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: 'smooth' });
  }

  toggleInfo(item: Show, event?: Event): void {
    event?.stopPropagation();
    this.infoItem = item;
    this.lockBodyScroll(true);
    this.cdr.markForCheck();
  }

  closeInfo(): void {
    this.infoItem = null;
    this.lockBodyScroll(false);
    this.cdr.markForCheck();
  }

  private runtime(item: Show): string | null {
    const seconds = item?.durationSeconds ?? 0;
    if (seconds < 60) return null;
    const hours = Math.floor(seconds / 3600);
    const mins  = Math.round((seconds % 3600) / 60);
    return hours ? `${hours}h ${mins}m` : `${mins}m`;
  }

  /** Convert a YouTube watch URL to an autoplay embed URL */
  getEmbedUrl(url: string): SafeResourceUrl {
    const videoId = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1];
    let embed: string;
    if (!videoId){
     embed = `https://www.youtube.com/embed/${url}?autoplay=1&mute=1`;
    } 
    else {
       embed = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(embed);
  }

  private loadProfile(): void {
    this.http.get<{ displayName: string | null }>(`${this.API}/api/v1/users/me`).subscribe({
      next: (profile) => {
        this.displayName = profile.displayName;
        this.cdr.markForCheck();
      },
      error: () => {
        // Profile fetch failing shouldn't block browsing — nav just falls back to initials.
      }
    });
  }

  /** Fades a poster in once it has actually decoded, instead of popping in. */
  onImageLoad(event: Event): void {
    (event.target as HTMLElement).classList.add('is-loaded');
  }

  // ── mobile bottom-tab chrome ───────────────────────────────────────────
  goHome(): void {
    this.closeSheets();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** Live TV's bottom-tab entry — the top-bar button is desktop-only now. */
  goLive(): void {
    this.closeSheets();
    this.router.navigate(['/myflixer/live']);
  }

  openSearch(): void {
    this.searchOpen = true;
    this.moreOpen = false;
    this.lockBodyScroll(true);
    this.cdr.markForCheck();
  }

  closeSearch(): void {
    this.searchOpen = false;
    this.lockBodyScroll(false);
    this.cdr.markForCheck();
  }

  openMore(): void {
    this.moreOpen = true;
    this.searchOpen = false;
    this.lockBodyScroll(true);
    this.cdr.markForCheck();
  }

  closeMore(): void {
    this.moreOpen = false;
    this.lockBodyScroll(false);
    this.cdr.markForCheck();
  }

  private closeSheets(): void {
    this.moreOpen = false;
    this.searchOpen = false;
    this.lockBodyScroll(false);
    this.cdr.markForCheck();
  }

  /** Stops the page behind an open sheet from scrolling with it. */
  private lockBodyScroll(locked: boolean): void {
    document.body.style.overflow = locked ? 'hidden' : '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.infoItem) this.closeInfo();
    else if (this.moreOpen || this.searchOpen) this.closeSheets();
  }

  private loadViewingProfiles(): void {
    this.profileService.list().subscribe({
      next: (profiles) => {
        this.profiles = profiles;
        this.cdr.markForCheck();
      },
      error: () => { /* switcher just stays empty on failure */ }
    });
  }

  /** Nav avatar always comes from the active viewing profile — accounts have no picture. */
  get navAvatarUrl(): string | null {
    if (this.activeProfile && this.profileService.isUrl(this.activeProfile.avatar)) {
      return this.activeProfile.avatar;
    }
    return null;
  }
  get navAvatarColor(): string | null {
    if (this.activeProfile) return this.profileService.colorFor(this.activeProfile.avatar);
    return null;
  }
  get navAvatarInitial(): string {
    const name = this.activeProfile?.name || this.displayName || this.userEmail || '?';
    return name.trim().charAt(0).toUpperCase();
  }

  profileColor(p: ViewingProfile): string | null { return this.profileService.colorFor(p.avatar); }
  profileIsUrl(p: ViewingProfile): boolean { return this.profileService.isUrl(p.avatar); }
  profileInitial(p: ViewingProfile): string { return (p.name || '?').trim().charAt(0).toUpperCase(); }

  switchProfile(p: ViewingProfile): void {
    this.profileService.setActive(p);
    // Already on /myflixer, so routing here would be a no-op — refetch instead,
    // otherwise Continue Watching would still show the previous profile's rows.
    this.loadHome();
  }

  /** Studio is reachable to everyone — creating a channel isn't gated. */
  goStudio(): void {
    this.router.navigate(['/myflixer/studio']);
  }

  switchProfilePicker(): void {
    this.router.navigate(['/myflixer/who']);
  }

  manageProfiles(): void {
    this.router.navigate(['/myflixer/manage-profiles']);
  }

  goAccount(): void {
    this.router.navigate(['/myflixer/profile']);
  }

  async logout() {
    await this.authService.logout();
    localStorage.removeItem('auth_token');
    this.profileService.clearActive();
    this.isLoggedIn = false;
    this.userEmail = null;
    this.displayName = null;
    this.profiles = [];
  }

  ngOnDestroy() {
    this.hoverTimers.forEach(t => clearTimeout(t));
    this.lockBodyScroll(false);   // don't leave the page unscrollable on navigate-away
  }
}