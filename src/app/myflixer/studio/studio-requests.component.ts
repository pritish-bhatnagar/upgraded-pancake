import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StudioService, StudioChannel, StreamingStatus } from './studio.service';

/**
 * Admin queue for streaming-access requests.
 *
 * The list is only a convenience — the real gate is server-side, so a
 * non-admin reaching this page sees an error rather than a working screen.
 */
@Component({
  selector: 'app-studio-requests',
  templateUrl: './studio-requests.component.html',
  styleUrls: ['./studio.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioRequestsComponent implements OnInit {
  channels: StudioChannel[] = [];
  loading = true;
  denied  = false;
  busyId: string | null = null;

  filter: StreamingStatus = 'pending';
  readonly filters: { key: StreamingStatus; label: string }[] = [
    { key: 'pending',   label: 'Pending' },
    { key: 'approved',  label: 'Approved' },
    { key: 'rejected',  label: 'Rejected' },
    { key: 'suspended', label: 'Suspended' },
  ];

  constructor(
    private studio: StudioService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  setFilter(status: StreamingStatus): void {
    this.filter = status;
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.studio.requests(this.filter).subscribe({
      next: (channels) => {
        this.channels = channels;
        this.loading  = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.denied  = err?.status === 403;
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  approve(channel: StudioChannel): void {
    this.act(channel, () => this.studio.approve(channel.id));
  }

  reject(channel: StudioChannel): void {
    const reason = prompt(`Why is @${channel.handle} being rejected?`) ?? '';
    this.act(channel, () => this.studio.reject(channel.id, reason));
  }

  suspend(channel: StudioChannel): void {
    const reason = prompt(`Why is @${channel.handle} being suspended?`) ?? '';
    this.act(channel, () => this.studio.suspend(channel.id, reason));
  }

  private act(channel: StudioChannel, run: () => { subscribe: Function }): void {
    if (this.busyId) return;
    this.busyId = channel.id;
    this.cdr.markForCheck();

    run().subscribe({
      next: () => { this.busyId = null; this.load(); },
      error: () => { this.busyId = null; this.cdr.markForCheck(); },
    });
  }

  back(): void {
    this.router.navigate(['/myflixer/studio']);
  }

  trackById = (_: number, c: StudioChannel) => c.id;
}
