import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FirebaseDataService } from 'src/app/tv-network/shared/firebase-data.service';
import { AdminService } from '../../admin/admin/admin.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit {
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
                  console.log(show.media)
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

  getMediaUrl(show: any): string {
    return show.media?.[0]?.url || '';
  }
}