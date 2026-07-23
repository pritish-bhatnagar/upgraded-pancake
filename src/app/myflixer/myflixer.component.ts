import { Component, ChangeDetectionStrategy, ElementRef, HostListener, ViewChild, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as bootstrap from 'bootstrap';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';



type Show = {
  id: string;
  title: string;
  subtitle?: string;
  tag?: string;           // e.g., "New", "Live", "Exclusive"
  img: string;            // full URL or assets path
};


@Component({
  selector: 'app-myflixer',
  templateUrl: './myflixer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./myflixer.component.scss']
})
export class MyflixerComponent implements OnInit, AfterViewInit, OnDestroy {
  private API = 'http://161.118.182.124:3000';
  private carouselInstance: bootstrap.Carousel | null = null;
  private hoverTimers: Map<number, ReturnType<typeof setTimeout>> = new Map();
  private readonly TRAILER_DELAY_MS = 1200; 
  // activeIndex = 0;
  trailerActiveIndex: number | null = null;

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  loading = true;

  trending: any[] = [];

  topPicks: any[] = [];

  responsiveOptions = [
    { breakpoint: '1024px', numVisible: 4, numScroll: 4 },
    { breakpoint: '768px', numVisible: 2, numScroll: 2 },
    { breakpoint: '560px', numVisible: 1, numScroll: 1 }
  ];

  ngOnInit() {

    this.http.get<any>(`${this.API}/api/v1/home?region=IN`).subscribe(({ rails = [] }) => {
  
      // Build a lookup map once — O(n) instead of multiple array.find() calls
      const railMap = rails.reduce((acc: Record<string, any>, rail: any) => {
        acc[rail.railKey] = rail;
        return acc;
      }, {});
    
      this.heroSlides        = railMap['hero']?.items             ?? [];
      this.continueWatching  = railMap['continue_watching']?.items ?? [];
      this.trendingNow       = railMap['trending_now']?.items      ?? [];
      this.featuredNews      = railMap['new_releases']?.items      ?? [];
    
      this.loading = false;
    });

  }

  scrolled = false;

  carouselInterval = 6000;
  activeIndex = 0;

  @ViewChild('heroCarousel', { static: true })
  heroCarouselRef!: ElementRef<HTMLElement>;

  heroSlides: Show[] = [];

  continueWatching: Show[] = [];

  trendingNow: Show[] = [];

  posters: string[] = [];

  featuredNews: Show[] = [];

  chunk<T>(arr: T[], size = 6): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled = (window?.scrollY || 0) > 12;
  }

  ngAfterViewInit(): void {
    
    const el = this.heroCarouselRef?.nativeElement;
 
    if (el) {
      this.carouselInstance = new bootstrap.Carousel(el, { interval: 5000, ride: 'carousel' });
      el.addEventListener('slid.bs.carousel', (e: any) => {
        this.activeIndex = e.to;
      });
    }
if (!el) return;
    el.addEventListener('slide.bs.carousel' as any, (e: any) => {
      this.resetAllProgressBars();
      this.activeIndex = e.to ?? 0;
    });

    el.addEventListener('slid.bs.carousel' as any, () => {
      this.startActiveProgressBar();
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

  ngOnDestroy() {
    this.hoverTimers.forEach(t => clearTimeout(t));
  }
}