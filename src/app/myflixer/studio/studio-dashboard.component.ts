import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval, switchMap, startWith } from 'rxjs';
import {
  StudioService, StudioChannel, IngestSettings, BroadcastStatus,
} from './studio.service';
import { ImageUploadService } from '../shared/image-upload.service';
import { copyText } from '../shared/clipboard';

/** How often the dashboard asks the media server whether we're on air. */
const STATUS_POLL_MS = 5000;

/**
 * One channel's control room: stream setup for OBS, and whether it's currently
 * on air. Live status, uptime and viewer count all come from the media server,
 * so this reflects what is actually happening rather than what was intended.
 */
@Component({
  selector: 'app-studio-dashboard',
  templateUrl: './studio-dashboard.component.html',
  styleUrls: ['./studio.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioDashboardComponent implements OnInit, OnDestroy {
  channel: StudioChannel | null = null;
  ingest:  IngestSettings | null = null;
  status:  BroadcastStatus | null = null;

  loading = true;
  error: string | null = null;

  /** The key is masked until asked for — it's a credential, not a label. */
  keyRevealed = false;
  copied: string | null = null;
  /** Both clipboard paths failed — say so instead of faking a checkmark. */
  copyFailed = false;
  busy = false;

  uploadingLogo = false;
  logoError: string | null = null;

  /** Inline edit of the channel's own details. */
  editing = false;
  savingDetails = false;
  detailsError: string | null = null;
  edit = { name: '', description: '', category: 'Entertainment' };

  readonly categories = ['Entertainment', 'News', 'Sports', 'Science', 'Music', 'Demo'];

  private poll?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studio: StudioService,
    private images: ImageUploadService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // paramMap, not snapshot: navigating between channels reuses the component.
    this.route.paramMap.subscribe(params => {
      const id = params.get('channelId');
      if (id) this.load(id);
    });
  }

  ngOnDestroy(): void {
    this.poll?.unsubscribe();
  }

  private load(id: string): void {
    this.loading = true;
    this.error = null;
    this.keyRevealed = false;

    this.studio.getChannel(id).subscribe({
      next: (channel) => {
        this.channel = channel;
        this.loading = false;
        this.cdr.markForCheck();

        if (channel.canBroadcast) {
          this.loadIngest(id);
          this.startPolling(id);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.status === 403
          ? 'This channel belongs to someone else.'
          : err?.status === 404 ? 'That channel no longer exists.'
          : 'Could not load the channel.';
        this.cdr.markForCheck();
      },
    });
  }

  private loadIngest(id: string): void {
    this.studio.ingest(id).subscribe({
      next: (ingest) => { this.ingest = ingest; this.cdr.markForCheck(); },
      // 403 here just means not approved; the template already explains that.
      error: () => { this.ingest = null; this.cdr.markForCheck(); },
    });
  }

  private startPolling(id: string): void {
    this.poll?.unsubscribe();
    this.poll = interval(STATUS_POLL_MS)
      .pipe(startWith(0), switchMap(() => this.studio.status(id)))
      .subscribe({
        next: (status) => { this.status = status; this.cdr.markForCheck(); },
        error: () => { /* transient; the next tick will retry */ },
      });
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  requestAccess(): void {
    if (!this.channel || this.busy) return;
    this.busy = true;
    this.studio.requestAccess(this.channel.id).subscribe({
      next: (channel) => { this.channel = channel; this.busy = false; this.cdr.markForCheck(); },
      error: (err) => {
        this.busy = false;
        this.error = err?.error?.error ?? 'Could not submit the request.';
        this.cdr.markForCheck();
      },
    });
  }

  rotateKey(): void {
    if (!this.channel || this.busy) return;
    if (!confirm('Generate a new stream key? Your current key stops working immediately, and OBS will need the new one.')) return;

    this.busy = true;
    this.studio.rotateKey(this.channel.id).subscribe({
      next: (ingest) => {
        this.ingest = ingest;
        this.keyRevealed = true;
        this.busy = false;
        this.cdr.markForCheck();
      },
      error: () => { this.busy = false; this.cdr.markForCheck(); },
    });
  }

  deleteChannel(): void {
    if (!this.channel || this.busy) return;
    if (!confirm(`Delete "${this.channel.name}"? This frees the handle @${this.channel.handle} for anyone else to take.`)) return;

    this.busy = true;
    this.studio.remove(this.channel.id).subscribe({
      next: () => this.router.navigate(['/myflixer/studio']),
      error: () => { this.busy = false; this.cdr.markForCheck(); },
    });
  }

  startEdit(): void {
    if (!this.channel) return;
    this.edit = {
      name:        this.channel.name,
      description: this.channel.description ?? '',
      category:    this.channel.category ?? 'Entertainment',
    };
    this.detailsError = null;
    this.editing = true;
    this.cdr.markForCheck();
  }

  cancelEdit(): void {
    this.editing = false;
    this.detailsError = null;
    this.cdr.markForCheck();
  }

  /**
   * Saves name/description/category. The handle is deliberately absent — it is
   * the document id and the stream address, so changing it would break OBS
   * setups and any link already shared.
   */
  saveDetails(): void {
    if (!this.channel || this.savingDetails || !this.edit.name.trim()) return;

    this.savingDetails = true;
    this.detailsError = null;
    this.cdr.markForCheck();

    this.studio.update(this.channel.id, {
      name:        this.edit.name.trim(),
      description: this.edit.description.trim(),
      category:    this.edit.category,
    }).subscribe({
      next: (channel) => {
        this.channel = channel;
        this.savingDetails = false;
        this.editing = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.savingDetails = false;
        this.detailsError = err?.error?.error ?? 'Could not save your changes.';
        this.cdr.markForCheck();
      },
    });
  }

  /** Swap the channel logo. Uploads via our backend, then persists the URL. */
  async pickLogo(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    input.value = '';
    if (!file || !this.channel) return;

    this.uploadingLogo = true;
    this.logoError = null;
    this.cdr.markForCheck();

    try {
      const { url } = await this.images.uploadAvatar(file, 'channel');
      this.saveLogo(url);
    } catch (err: any) {
      this.logoError = err?.message ?? 'Could not upload that image.';
      this.uploadingLogo = false;
      this.cdr.markForCheck();
    }
  }

  removeLogo(): void {
    if (!this.channel || this.uploadingLogo) return;
    this.uploadingLogo = true;
    this.cdr.markForCheck();
    this.saveLogo(null);
  }

  private saveLogo(logoUrl: string | null): void {
    if (!this.channel) return;
    this.studio.update(this.channel.id, { logoUrl }).subscribe({
      next: (channel) => {
        this.channel = channel;
        this.uploadingLogo = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.logoError = err?.error?.error ?? 'Could not save the logo.';
        this.uploadingLogo = false;
        this.cdr.markForCheck();
      },
    });
  }

  copy(value: string, label: string): void {
    copyText(value).then((ok) => {
      // Only tick the checkmark if the text really landed on the clipboard —
      // a false confirmation here costs the creator a failed broadcast.
      this.copied = ok ? label : null;
      this.copyFailed = !ok;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.copied = null;
        this.copyFailed = false;
        this.cdr.markForCheck();
      }, 1800);
    });
  }

  watchLive(): void {
    if (this.channel) this.router.navigate(['/myflixer/live', this.channel.id]);
  }

  back(): void {
    this.router.navigate(['/myflixer/studio']);
  }

  // ── View helpers ───────────────────────────────────────────────────────────

  get maskedKey(): string {
    if (!this.ingest) return '';
    return this.keyRevealed ? this.ingest.streamKey : this.ingest.streamKey.replace(/key=.*/, 'key=' + '•'.repeat(16));
  }

  /** "1h 04m 12s" — creators watch this to confirm the stream is holding up. */
  get uptimeLabel(): string {
    const total = this.status?.uptime ?? 0;
    if (!total) return '—';
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m ${String(s).padStart(2, '0')}s`;
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'approved':  return 'Approved to stream';
      case 'pending':   return 'Awaiting review';
      case 'rejected':  return 'Not approved';
      case 'suspended': return 'Suspended';
      default:          return 'Streaming not requested';
    }
  }
}
