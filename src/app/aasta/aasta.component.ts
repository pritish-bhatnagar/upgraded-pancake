import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component } from '@angular/core';

@Component({
  selector: 'app-aasta',
  templateUrl: './aasta.component.html',
  styleUrls: ['./aasta.component.scss'],
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0, transform: 'translateY(20px)' })),
      transition(':enter', [animate('700ms ease-out')]),
    ]),
  ],
})
export class AastaComponent {
  galleryImages: string[] = [
    'https://placehold.co/300x300',
    'https://placehold.co/300x300?text=Photo+2',
    'https://placehold.co/300x300?text=Photo+3',
    'https://placehold.co/300x300?text=Photo+4',
    'https://placehold.co/300x300?text=Photo+5',
    'https://placehold.co/300x300?text=Photo+6',
  ];

  myQuotes: string[] = [
    "Believe in yourself and magic will happen.",
    "Consistency beats talent when talent doesn’t show up.",
    "Your voice matters—use it boldly.",
  ];
}
