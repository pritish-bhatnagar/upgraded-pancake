import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { PlayerKind, PlayerProgress } from './video-player.component';

interface SampleSource {
  name:  string;
  note:  string;
  src:   string;
  kind:  PlayerKind;
  live:  boolean;
  poster?: string;
}

/**
 * Throwaway harness for the custom player at /myflixer/player-lab.
 * Not part of the MyFlixer product surface — delete once the player is wired
 * into the real watch page.
 */
@Component({
  selector: 'app-myflixer-player-lab',
  templateUrl: './player-lab.component.html',
  styleUrls: ['./player-lab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyflixerPlayerLabComponent {
  readonly samples: SampleSource[] = [
    {
      name: 'MP4 (progressive)',
      note: 'No hls.js — the lazy chunk is never fetched for this one.',
      src:  'https://vjs.zencdn.net/v/oceans.mp4',
      kind: 'mp4',
      live: false,
      poster: 'https://vjs.zencdn.net/v/oceans.png',
    },
    {
      name: 'HLS VOD — multi-bitrate',
      note: 'Exercises the quality menu (5 renditions) and ABR switching.',
      src:  'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      kind: 'hls',
      live: false,
    },
    {
      name: 'HLS VOD — Apple fMP4',
      note: 'Apple BipBop reference stream, many renditions.',
      src:  'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
      kind: 'hls',
      live: false,
    },
  ];

  selected = this.samples[0];
  customUrl = '';
  liveMode = false;
  log: string[] = [];

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  get activeSrc(): string { return this.customUrl.trim() || this.selected.src; }
  get activeKind(): PlayerKind { return this.customUrl.trim() ? 'auto' : this.selected.kind; }
  get activeLive(): boolean { return this.liveMode || (!this.customUrl.trim() && this.selected.live); }
  get activePoster(): string | null {
    return this.customUrl.trim() ? null : (this.selected.poster ?? null);
  }

  pick(sample: SampleSource): void {
    this.selected = sample;
    this.customUrl = '';
    this.log = [];
  }

  onCustomUrl(value: string): void {
    this.customUrl = value;
    this.log = [];
  }

  onProgress(p: PlayerProgress): void {
    this.push(`progress ${p.currentTime.toFixed(1)}s / ${p.duration.toFixed(1)}s (${p.percent.toFixed(1)}%)`);
  }

  onEnded(): void { this.push('ended'); }

  goBack(): void { this.router.navigate(['/myflixer']); }

  private push(line: string): void {
    const time = new Date().toLocaleTimeString();
    this.log = [`${time}  ${line}`, ...this.log].slice(0, 8);
    this.cdr.markForCheck();
  }
}
