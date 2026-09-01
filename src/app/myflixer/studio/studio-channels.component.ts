import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StudioService, StudioChannel } from './studio.service';
import { ImageUploadService } from '../shared/image-upload.service';

/**
 * Studio landing page: the channels you own, and the form to create one.
 * Creating a channel is open to everyone — broadcasting is what needs approval,
 * so nothing here is gated.
 */
@Component({
  selector: 'app-studio-channels',
  templateUrl: './studio-channels.component.html',
  styleUrls: ['./studio.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioChannelsComponent implements OnInit {
  channels: StudioChannel[] = [];
  loading = true;
  isAdmin = false;

  /** Create form. */
  showForm = false;
  saving   = false;
  formError: string | null = null;
  form = { handle: '', name: '', description: '', category: 'Entertainment', logoUrl: null as string | null };

  uploadingLogo = false;
  logoError: string | null = null;

  readonly categories = ['Entertainment', 'News', 'Sports', 'Science', 'Music', 'Demo'];

  constructor(
    private studio: StudioService,
    private images: ImageUploadService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
    this.studio.isAdmin().subscribe({
      next: (yes) => { this.isAdmin = yes; this.cdr.markForCheck(); },
      error: () => { this.isAdmin = false; },
    });
  }

  private load(): void {
    this.loading = true;
    this.studio.myChannels().subscribe({
      next: (channels) => {
        this.channels = channels;
        this.loading  = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  /** Suggest a handle from the name, so most people never touch the field. */
  onNameInput(): void {
    if (this.form.handle) return;
    this.form.handle = this.slugify(this.form.name);
  }

  onHandleInput(): void {
    this.form.handle = this.slugify(this.form.handle);
  }

  private slugify(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+/, '').slice(0, 30);
  }

  openForm(): void {
    this.showForm  = true;
    this.formError = null;
  }

  cancelForm(): void {
    this.showForm = false;
    this.logoError = null;
    this.form = { handle: '', name: '', description: '', category: 'Entertainment', logoUrl: null };
  }

  /**
   * Uploads through our own backend, which stores the image on Cloudinary and
   * hands back a URL — the browser never talks to Cloudinary directly.
   */
  async pickLogo(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    // Clear immediately so re-picking the same file still fires a change event.
    input.value = '';
    if (!file) return;

    this.uploadingLogo = true;
    this.logoError = null;
    this.cdr.markForCheck();

    try {
      const { url } = await this.images.uploadAvatar(file, 'channel');
      this.form.logoUrl = url;
    } catch (err: any) {
      this.logoError = err?.message ?? 'Could not upload that image.';
    } finally {
      this.uploadingLogo = false;
      this.cdr.markForCheck();
    }
  }

  clearLogo(): void {
    this.form.logoUrl = null;
    this.cdr.markForCheck();
  }

  create(): void {
    if (this.saving) return;
    this.saving    = true;
    this.formError = null;

    this.studio.create({
      handle:      this.form.handle,
      name:        this.form.name,
      description: this.form.description,
      category:    this.form.category,
      logoUrl:     this.form.logoUrl,
    }).subscribe({
      next: (channel) => {
        this.saving = false;
        this.cancelForm();
        this.router.navigate(['/myflixer/studio', channel.id]);
      },
      error: (err) => {
        this.saving    = false;
        this.formError = err?.error?.error ?? 'Could not create the channel.';
        this.cdr.markForCheck();
      },
    });
  }

  open(channel: StudioChannel): void {
    this.router.navigate(['/myflixer/studio', channel.id]);
  }

  back(): void {
    this.router.navigate(['/myflixer']);
  }

  goRequests(): void {
    this.router.navigate(['/myflixer/studio/requests']);
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

  trackById = (_: number, c: StudioChannel) => c.id;
}
