import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
type Show = {
  id: string;
  title: string;
  subtitle?: string;
  tag?: string;           // e.g., "New", "Live", "Exclusive"
  img: string;            // full URL or assets path
};

@Component({
  selector: 'app-soap2day',
  templateUrl: './soap2day.component.html',
  styleUrls: ['./soap2day.component.scss']
})
export class Soap2dayComponent {
  loading = true;

  trending = [
    { title: 'Movie 1', image: 'https://picsum.photos/200/300?1' },
    { title: 'Movie 2', image: 'https://picsum.photos/200/300?2' },
    { title: 'Movie 3', image: 'https://picsum.photos/200/300?3' },
    { title: 'Movie 4', image: 'https://picsum.photos/200/300?4' },
    { title: 'Movie 5', image: 'https://picsum.photos/200/300?5' }
  ];

  topPicks = [
    { title: 'Series 1', image: 'https://picsum.photos/200/300?6' },
    { title: 'Series 2', image: 'https://picsum.photos/200/300?7' },
    { title: 'Series 3', image: 'https://picsum.photos/200/300?8' },
    { title: 'Series 4', image: 'https://picsum.photos/200/300?9' }
  ];

  responsiveOptions = [
    { breakpoint: '1024px', numVisible: 4, numScroll: 4 },
    { breakpoint: '768px', numVisible: 2, numScroll: 2 },
    { breakpoint: '560px', numVisible: 1, numScroll: 1 }
  ];

  ngOnInit() {
    // fake loading delay for Lottie animation
    setTimeout(() => {
      this.loading = false;
    }, 2000);
  }
  scrolled = false;

  carouselInterval = 6000;
  activeIndex = 0;

  @ViewChild('heroCarousel', { static: true })
  heroCarouselRef!: ElementRef<HTMLElement>;

  heroSlides: Show[] = [
    {
      id: 'h1',
      title: 'Big Fall Premieres',
      subtitle: 'Brand-new episodes weekly',
      tag: 'New',
      img: 'https://picsum.photos/1600/700?random=1',
    },
    {
      id: 'h2',
      title: 'Live Sports Weekend',
      subtitle: 'Marquee matchups in HD',
      tag: 'Live',
      img: 'https://picsum.photos/1600/700?random=2',
    },
    {
      id: 'h3',
      title: 'Fan Favorites',
      subtitle: 'Binge top series, anytime',
      tag: 'Trending',
      img: 'https://picsum.photos/1600/700?random=3',
    },
  ];

  continueWatching = Array.from({ length: 10 }, (_, i) => ({
    id: `cw${i + 1}`,
    title: `Show ${i + 1}`,
    subtitle: `S${1 + (i % 3)} · E${1 + (i % 10)}`,
    img: `https://picsum.photos/600/338?random=${10 + i}`,
  }));

  trendingNow = Array.from({ length: 18 }, (_, i) => ({
    id: `t${i + 1}`,
    title: `Trending ${i + 1}`,
    img: `https://picsum.photos/600/338?random=${40 + i}`,
  }));

  posters: string[] = Array.from(
    { length: 18 },
    (_, i) => `https://picsum.photos/500/750?random=${100 + i}`
  );

  featuredNews: Show[] = [
    {
      id: 'n1',
      title: 'Top Stories',
      subtitle: 'Daily highlights',
      img: 'https://picsum.photos/800/500?random=200',
    },
    {
      id: 'n2',
      title: 'In-Depth',
      subtitle: 'Explainers & analysis',
      img: 'https://picsum.photos/800/500?random=201',
    },
    {
      id: 'n3',
      title: 'World View',
      subtitle: 'Global coverage',
      img: 'https://picsum.photos/800/500?random=202',
    },
  ];

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
    const el = this.heroCarouselRef.nativeElement;

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
}
