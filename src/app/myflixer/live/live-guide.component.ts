import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { ChannelGuide, LiveChannel, LiveService } from './live.service';

/** Language tags we can name properly; anything else falls back to the raw tag. */
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',   es: 'Spanish',    hi: 'Hindi',    fr: 'French',
  de: 'German',    it: 'Italian',    pt: 'Portuguese', ar: 'Arabic',
  ru: 'Russian',   zh: 'Chinese',    ja: 'Japanese', ko: 'Korean',
  nl: 'Dutch',     tr: 'Turkish',    pl: 'Polish',   ta: 'Tamil',
  te: 'Telugu',    ml: 'Malayalam',  bn: 'Bengali',  pa: 'Punjabi',
  ku: 'Kurdish',   ur: 'Urdu',       sv: 'Swedish',  el: 'Greek',
};

/**
 * The live channel guide — a search overlay over whatever is on air right now.
 *
 * Self-contained and reusable: drop `<app-live-guide [open]="…" (closed)="…">`
 * anywhere. It fetches when opened, searches server-side as you type, and
 * navigates to the live player on pick. It's used from the top nav on the
 * browse page and from the "Channels" button on the player itself.
 */
@Component({
  selector: 'app-live-guide',
  templateUrl: './live-guide.component.html',
  styleUrls: ['./live-guide.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveGuideComponent implements OnChanges, OnDestroy {
  /** Drives visibility. Opening (false → true) triggers a fresh fetch. */
  @Input() open = false;
  /**
   * 'overlay' floats above the current screen (used over the player, so a
   * channel hop never interrupts playback). 'page' renders inline as a full
   * screen of its own, for the /myflixer/live route.
   */
  @Input() variant: 'overlay' | 'page' = 'overlay';
  @Output() closed = new EventEmitter<void>();

  get isPage(): boolean {
    return this.variant === 'page';
  }

  /** Clicking the dimmed surround dismisses an overlay; a page has no surround. */
  onBackdropClick(): void {
    if (!this.isPage) this.close();
  }

  @ViewChild('searchBox') private searchBox?: ElementRef<HTMLInputElement>;

  query = '';
  category: string | null = null;
  language: string | null = null;
  liveOnly = true;
  loading = false;
  failed = false;

  channels: LiveChannel[] = [];
  categories: string[] = [];
  languages: string[] = [];
  liveCount = 0;

  page = 1;
  pageCount = 1;
  totalCount = 0;

  private readonly queries = new Subject<string>();
  private readonly subs = new Subscription();

  constructor(
    private live: LiveService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    // Debounced so a fast typist doesn't fire a request per keystroke;
    // switchMap so a slow earlier response can't overwrite a newer one.
    this.subs.add(
      this.queries
        .pipe(
          debounceTime(250),
          distinctUntilChanged(),
          switchMap((q) => {
            this.loading = true;
            // A new search invalidates whatever page we were on.
            this.page = 1;
            this.cdr.markForCheck();
            return this.live.search(this.criteria(q)).pipe(
              catchError(() => of(null))
            );
          })
        )
        .subscribe((guide) => this.apply(guide))
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.refresh();
      this.loadFilters();
      // The panel animates in; focus once it's actually on screen.
      setTimeout(() => this.searchBox?.nativeElement.focus(), 120);
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.close();
  }

  onQuery(value: string): void {
    this.query = value;
    this.queries.next(value);
  }

  /** Category, language and live-only all narrow server-side, so each re-fetches. */
  pickCategory(category: string | null): void {
    this.category = this.category === category ? null : category;
    this.refresh();
  }

  pickLanguage(language: string | null): void {
    this.language = this.language === language ? null : language;
    this.refresh();
  }

  toggleLiveOnly(): void {
    this.liveOnly = !this.liveOnly;
    this.refresh();
  }

  /** 'es' → 'Spanish'; unknown tags show as-is rather than being hidden. */
  languageLabel(tag: string): string {
    return LANGUAGE_NAMES[tag.toLowerCase()] ?? tag.toUpperCase();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pageCount || page === this.page || this.loading) return;
    this.page = page;
    this.refresh({ keepPage: true });
  }

  /** Page numbers to render — a window around the current page, never all of them. */
  get pageWindow(): number[] {
    const span  = 5;
    const start = Math.max(1, Math.min(this.page - Math.floor(span / 2), this.pageCount - span + 1));
    const end   = Math.min(this.pageCount, start + span - 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  watch(channel: LiveChannel): void {
    if (!channel.isLive) return;
    this.close();
    this.router.navigate(['/myflixer/live', channel.id]);
  }

  close(): void {
    this.query = '';
    this.category = null;
    this.language = null;
    this.page = 1;
    this.closed.emit();
  }

  /** Logo-less channels fall back to their initials on a coloured tile. */
  initials(channel: LiveChannel): string {
    return channel.name
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase();
  }

  trackByChannel = (_: number, channel: LiveChannel) => channel.id;

  /**
   * Re-fetch the current page. Changing a filter resets to page 1 — staying on
   * page 4 of a lineup that just shrank to two pages would show an empty grid.
   */
  private refresh(opts: { keepPage?: boolean } = {}): void {
    if (!opts.keepPage) this.page = 1;
    this.loading = true;
    this.failed = false;
    this.cdr.markForCheck();

    this.live.search(this.criteria()).subscribe({
      next: (guide) => this.apply(guide),
      error: () => this.apply(null),
    });
  }

  private criteria(query = this.query) {
    return {
      query,
      category: this.category,
      language: this.language,
      liveOnly: this.liveOnly,
      page:     this.page,
    };
  }

  private loadFilters(): void {
    if (!this.categories.length) {
      this.live.categories().subscribe({
        next: ({ categories }) => {
          this.categories = categories;
          this.cdr.markForCheck();
        },
        error: () => { /* chips just stay hidden */ },
      });
    }
    if (!this.languages.length) {
      this.live.languages().subscribe({
        next: ({ languages }) => {
          this.languages = languages;
          this.cdr.markForCheck();
        },
        error: () => { /* chips just stay hidden */ },
      });
    }
  }

  private apply(guide: ChannelGuide | null): void {
    this.loading = false;
    this.failed = guide === null;
    this.channels = guide?.channels ?? [];
    this.liveCount = guide?.liveCount ?? 0;
    this.totalCount = guide?.totalCount ?? 0;
    this.pageCount = guide?.pageCount ?? 1;
    // The server clamps an out-of-range page; mirror what it actually served.
    this.page = guide?.page ?? 1;
    this.cdr.markForCheck();
  }
}
