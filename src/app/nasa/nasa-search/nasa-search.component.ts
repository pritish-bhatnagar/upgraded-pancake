import { Component } from '@angular/core';
import { NasaService } from '../nasa.service';

@Component({
  selector: 'app-nasa-search',
  templateUrl: './nasa-search.component.html',
  styleUrls: ['./nasa-search.component.scss']
})
export class NasaSearchComponent {
  query = 'moon';
  results: any[] = [];
  loading = false;

  constructor(private nasaService: NasaService) {
    this.search();
  }

  search() {
    this.loading = true;
    this.results = [];

    this.nasaService.searchNasaImages(this.query).subscribe((data) => {
      const items = data.collection.items;

      // Filter and preload videos
      items.forEach((item: any) => {
        const type = item.data[0].media_type;

        if (type === 'video') {
          const nasaId = item.data[0].nasa_id;
          this.nasaService.getAssetByNasaId(nasaId).subscribe((asset) => {
            const mp4 = asset.collection.items.find((i: any) =>
              i.href.endsWith('.mp4')
            );
            if (mp4) {
              item.videoUrl = mp4.href;
              this.results.push(item);
            }
          });
        } else if (type === 'image') {
          this.results.push(item);
        }
      });

      this.loading = false;
    });
  }
}
