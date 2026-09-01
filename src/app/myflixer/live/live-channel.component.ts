import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { LivePlayback, LiveService } from './live.service';
import { shareOrCopy } from '../shared/clipboard';

/**
 * The live streaming page — /myflixer/live/:channelId.
 *
 * Resolves a channel through GET /api/v1/live/channels/:id and hands the HLS
 * manifest to the shared player in live mode (LIVE badge, seekable-window
 * timeline, GO LIVE when you drift behind). No progress is recorded: a linear
 * channel has no resume point, you always join what's on now.
 */
@Component({
  selector: 'app-myflixer-live-channel',
  templateUrl: './live-channel.component.html',
  styleUrls: ['./live-channel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyflixerLiveChannelComponent implements OnInit, OnDestroy {
  loading = true;
  playback: LivePlayback | null = null;
  errorTitle = '';
  errorMessage = '';

  /** Guards against overlapping liveness checks while stalled. */
  private checkingLiveness = false;

  private routeSub?: Subscription;
  private loadSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private live: LiveService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // paramMap, not a snapshot: hopping to another channel reuses this
    // component instance, so the id changes underneath it.
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const channelId = params.get('channelId');
      if (!channelId) {
        this.fail('No channel selected', 'Pick a channel from the guide.');
        return;
      }
      this.load(channelId);
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.loadSub?.unsubscribe();
    clearTimeout(this.shareTimer);
  }

  /** Transient confirmation under the player after a share. */
  shareNote = '';
  private shareTimer?: ReturnType<typeof setTimeout>;

  /** The guide is a page of its own now — no dialog anywhere in the app. */
  openGuide(): void {
    this.router.navigate(['/myflixer/live']);
  }

  /**
   * Share the channel page, not the stream URL — a broadcaster's manifest is
   * theirs to hand out, and it would expire or geo-fail for the recipient
   * anyway. Uses the native share sheet where there is one, clipboard where
   * there isn't.
   */
  shareChannel(): void {
    if (!this.playback) return;

    const url = `${location.origin}/myflixer/live/${this.playback.channelId}`;

    shareOrCopy({
      title: this.playback.name,
      text:  `Watch ${this.playback.name} live on MyFlixer`,
      url,
    }).then((outcome) => {
      if (outcome === 'copied') this.note('Link copied');
      if (outcome === 'failed') this.note('Could not copy the link');
      // 'shared' — the OS sheet already gave its own feedback.
    });
  }

  private note(message: string): void {
    this.shareNote = message;
    this.cdr.markForCheck();
    clearTimeout(this.shareTimer);
    this.shareTimer = setTimeout(() => {
      this.shareNote = '';
      this.cdr.markForCheck();
    }, 2200);
  }

  exit(): void {
    this.router.navigate(['/myflixer']);
  }

  /**
   * The broadcaster stopped. The player has already given up retrying, so swap
   * it for the off-air panel rather than leaving a dead video element behind.
   */
  onStreamEnded(): void {
    this.fail('Stream ended', 'This broadcast has finished. Pick another channel from the guide.');
  }

  /**
   * The player has been buffering for a while. That is ambiguous on its own —
   * a slow connection looks the same as a broadcaster who quit — so ask the
   * server, which measures liveness directly, instead of guessing. Genuine
   * buffering just carries on.
   */
  onStalled(): void {
    const channelId = this.route.snapshot.paramMap.get('channelId');
    if (!channelId || this.checkingLiveness) return;

    this.checkingLiveness = true;
    this.live.getPlayback(channelId).subscribe({
      next: () => { this.checkingLiveness = false; },
      error: (err: HttpErrorResponse) => {
        this.checkingLiveness = false;
        if (err.status === 409) {
          this.fail('Stream ended', 'This broadcast has finished. Pick another channel from the guide.');
        } else if (err.status === 404) {
          this.fail('Channel not found', 'That channel is no longer in the lineup.');
        }
        // Anything else is likely a blip in our own request — keep playing.
      },
    });
  }

  retry(): void {
    const channelId = this.route.snapshot.paramMap.get('channelId');
    if (channelId) this.load(channelId);
  }

  private load(channelId: string): void {
    this.loadSub?.unsubscribe();
    this.loading = true;
    this.playback = null;
    this.errorTitle = '';
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.loadSub = this.live.getPlayback(channelId).subscribe({
      next: (playback) => {
        this.playback = playback;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.router.navigate(['/myflixer/login']);
          return;
        }
        if (err.status === 404) {
          this.fail('Channel not found', 'That channel is no longer in the lineup.');
        } else if (err.status === 409) {
          this.fail('Off air', 'This channel is not broadcasting right now. Try another one.');
        } else {
          this.fail('Something went wrong', 'We could not tune in. Please try again.');
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
}
