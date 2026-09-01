import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { Playback, WatchService } from '../shared/watch.service';
import { PlayerProgress } from '../player/video-player.component';

/**
 * The MyFlixer watch page — /myflixer/watch/:contentId.
 *
 * Resolves the title through GET /api/v1/watch/:contentId (stream URL, poster,
 * and this profile's resume position), hands it to the custom player, and
 * writes the player's 5s progress heartbeat back to the API so Continue
 * Watching stays current.
 *
 * OnPush: every state change here comes from an explicit callback, so each one
 * marks the view.
 */
@Component({
  selector: 'app-myflixer-watch',
  templateUrl: './watch.component.html',
  styleUrls: ['./watch.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyflixerWatchComponent implements OnInit, OnDestroy {
  loading = true;
  playback: Playback | null = null;
  errorTitle = '';
  errorMessage = '';

  private routeSub?: Subscription;
  private loadSub?: Subscription;
  /** Last position the player reported, kept for the teardown save. */
  private lastPosition = 0;
  private lastDuration = 0;
  private savedOnTeardown = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private watch: WatchService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // paramMap rather than a snapshot: navigating from one title straight to
    // another reuses this component instance, so the id can change under us.
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const contentId = params.get('contentId');
      if (!contentId) {
        this.fail('Nothing to play', 'No title was specified.');
        return;
      }
      this.load(contentId);
    });
  }

  ngOnDestroy(): void {
    this.flush();
    this.routeSub?.unsubscribe();
    this.loadSub?.unsubscribe();
  }

  /** Tab close / app switch — persist before the page can go away. */
  @HostListener('window:pagehide')
  @HostListener('window:beforeunload')
  onPageHide(): void {
    this.flush();
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (document.visibilityState === 'hidden') this.flush();
  }

  // ── Player events ──────────────────────────────────────────────────────────

  /** Throttled to once every 5s of playback by the player itself. */
  onProgress(p: PlayerProgress): void {
    if (!this.playback) return;
    this.lastPosition = p.currentTime;
    this.lastDuration = p.duration;
    this.savedOnTeardown = false;
    this.watch.saveProgress(this.playback.contentId, p.currentTime, p.duration).subscribe({
      // A dropped heartbeat is not worth interrupting playback for — the next
      // one (or the teardown save) carries the position anyway.
      error: () => {},
    });
  }

  onEnded(): void {
    if (!this.playback) return;
    // Send the full duration so the backend's completion threshold trips and
    // the title leaves Continue Watching.
    const duration = this.lastDuration || this.playback.durationSeconds;
    this.watch.saveProgress(this.playback.contentId, duration, duration).subscribe({
      next: () => this.exit(),
      error: () => this.exit(),
    });
    this.savedOnTeardown = true;
  }

  exit(): void {
    this.router.navigate(['/myflixer']);
  }

  retry(): void {
    const contentId = this.route.snapshot.paramMap.get('contentId');
    if (contentId) this.load(contentId);
  }

  // ── internals ──────────────────────────────────────────────────────────────

  private load(contentId: string): void {
    this.loadSub?.unsubscribe();
    this.loading = true;
    this.playback = null;
    this.errorTitle = '';
    this.errorMessage = '';
    this.lastPosition = 0;
    this.lastDuration = 0;
    this.cdr.markForCheck();

    this.loadSub = this.watch.getPlayback(contentId).subscribe({
      next: (playback) => {
        this.playback = playback;
        this.lastDuration = playback.durationSeconds;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.router.navigate(['/myflixer/login']);
          return;
        }
        if (err.status === 404) {
          this.fail('Title not found', "We couldn't find what you were looking for.");
        } else if (err.status === 409) {
          this.fail('Not available yet', 'This title has no stream attached — try another one.');
        } else {
          this.fail('Something went wrong', 'We could not start playback. Please try again.');
        }
      },
    });
  }

  private fail(title: string, message: string): void {
    this.loading = false;
    this.playback = null;
    this.errorTitle = title;
    this.errorMessage = message;
    this.cdr.markForCheck();
  }

  /** Persist the current position once, on whichever teardown fires first. */
  private flush(): void {
    if (this.savedOnTeardown || !this.playback || this.lastPosition <= 0) return;
    this.savedOnTeardown = true;
    this.watch.saveProgressBeacon(this.playback.contentId, this.lastPosition, this.lastDuration);
  }
}
