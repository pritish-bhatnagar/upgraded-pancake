import { Component } from '@angular/core';

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
}
