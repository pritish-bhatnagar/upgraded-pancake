import { Component } from '@angular/core';
import { NasaService } from './nasa.service';

@Component({
  selector: 'app-nasa',
  templateUrl: './nasa.component.html',
  styleUrls: ['./nasa.component.scss']
})
export class NasaComponent {
  apod: any;
  marsPhotos: any[] = [];
  asteroids: any[] = [];
  earthImageUrl: string = '';
  imageResults: any[] = [];
  donkiCmes: any[] = [];
donkiFlares: any[] = [];
videoResults: any[] = [];

  constructor(private nasaService: NasaService) {}

  ngOnInit(): void {
    this.nasaService.getApod().subscribe((data) => (this.apod = data));

    this.nasaService.getMarsRoverPhotos().subscribe((data) => {
      this.marsPhotos = data.photos.slice(0, 5); // Limit to 5 images
    });

    this.nasaService.getAsteroids('2025-06-20', '2025-06-22').subscribe((data) => {
      this.asteroids = Object.values(data.near_earth_objects).flat();
    });

    this.nasaService.getEarthImagery(1.5, 100.75, '2020-06-01').subscribe((data) => {
      this.earthImageUrl = data.url;
    });

    const start = '2025-06-15';
  const end = '2025-06-20';

  this.nasaService.getCME(start, end).subscribe((data) => {
    this.donkiCmes = data;
  });

  this.nasaService.getSolarFlares(start, end).subscribe((data) => {
    this.donkiFlares = data;
  });
  }
}
