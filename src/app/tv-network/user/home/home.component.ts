import { AfterViewInit, Component, ElementRef, HostListener, OnInit, QueryList, ViewChildren } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FirebaseDataService } from 'src/app/tv-network/shared/firebase-data.service';
import { AdminService } from '../../admin/admin/admin.service';

type Show = {
  id: string;
  title: string;
  subtitle?: string;
  tag?: string;           // e.g., "New", "Live", "Exclusive"
  img: string;            // full URL or assets path
};

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit {
  isScrolled = false;
 
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50; // true if scrolled more than 50px
  }
  sections: {
    tag: string;
    type: string;
    items: any[];
    loaded: boolean;
  }[] = [];

  @ViewChildren('lazySection') lazySections!: QueryList<ElementRef>;

  constructor(
    private firebaseDataService: FirebaseDataService,
    private adminService: AdminService
  ) {}

  async ngOnInit() {
    const tags = await this.adminService.getTags();

    this.sections = tags
      .filter(tag => tag.type === 'show' || (tag.type === 'episode' && tag.showOnHome))
      .map(tag => ({
        tag: tag.name,
        type: tag.type,
        items: [],
        loaded: false
      }));
  }

  scrollLeft(index: number) {
    const containers = document.querySelectorAll<HTMLElement>('.show-scroll');
    const el = containers[index];
    if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
  }
  
  scrollRight(index: number) {
    const containers = document.querySelectorAll<HTMLElement>('.show-scroll');
    const el = containers[index];
    if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
  }
  ngAfterViewInit() {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(async entry => {
          if (entry.isIntersecting) {
            const index = this.lazySections
              .toArray()
              .findIndex(el => el.nativeElement === entry.target);
            const section = this.sections[index];

            if (!section.loaded) {
              if (section.type === 'show') {
                const shows = await this.firebaseDataService.getShowsByTag(section.tag);

                // Enrich each show with relevant media (e.g. Banner, Poster, etc.)
                for (const show of shows) {
                  const mediaCategory = this.mapTagToMediaCategory(section.tag);
                  const mediaItems = await this.firebaseDataService.getMediaForShowByCategory(
                    show.id,
                    mediaCategory
                  );
                 
                  show.media = mediaItems;
                  // console.log(show.media)
                }

                section.items = shows;
              } 
              // else if (section.type === 'episode') {
              //   const episodes = await this.firebaseDataService.getEpisodesByTag(section.tag.toLowerCase());
              //   section.items = episodes;
              // }

              section.loaded = true;
            }
          }
        });
      },
      { root: null, threshold: 0.1 }
    );

    this.lazySections.changes.subscribe(() => {
      this.lazySections.forEach(section => observer.observe(section.nativeElement));
    });

    this.lazySections.forEach(section => observer.observe(section.nativeElement));


    
    const carousels = document.querySelectorAll('.carousel');
  carousels.forEach(carousel => {
    carousel.addEventListener('slid.bs.carousel', () => {
      // Reset all progress bars
      const bars = carousel.querySelectorAll('.carousel-indicators-vertical .progress-bar');
      bars.forEach(bar => {
        (bar as HTMLElement).style.animation = 'none'; // reset animation
      });

      // Force reflow (restart animation properly)
      void (bars[0] as HTMLElement)?.offsetHeight;

      // Animate active one
      const activeBtn = carousel.querySelector('.carousel-indicators-vertical button.active .progress-bar');
      if (activeBtn) {
        (activeBtn as HTMLElement).style.animation = 'fillBar 2s linear forwards';
      }
    });
  });
  }

  mapTagToMediaCategory(tag: string): string {
    switch (tag.toLowerCase()) {
      case 'hero':
        return 'Banner';
      case 'trending':
        return 'Poster';
      case 'featured':
        return 'Thumbnail';
      case 'new release':
        return 'Trailer';
      case 'top rated':
        return 'Preview';
      default:
        return 'Poster';
    }
  }


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


  getMediaUrl(show: any, category: string): string {
    console.log(category)
    const mediaItem = show.media?.find((m: any) => {
      console.log(m.category) 
      return m.category?.toLowerCase() === category.toLowerCase()}) || 'law'
    console.log(mediaItem)
    return mediaItem.url || '' ;
  }


  chunk<T>(arr: T[], size = 6): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }
}