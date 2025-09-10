import { trigger, transition, style, animate } from '@angular/animations';
import { Component } from '@angular/core';

@Component({
  selector: 'app-hogsmeade',
  templateUrl: './hogsmeade.component.html',
  styleUrls: ['./hogsmeade.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('700ms ease-out'),
      ]),
    ]),
  ],
})
export class HogsmeadeComponent {
// Dynamic car model list
carModels = [
  {
    name: 'X9 Prestige',
   image: 'https://placehold.co/400x200/111/fff?text=Model+X9',
    description: 'Luxury and performance in harmony.',
  },
  {
    name: 'Vanta GT',
    image: 'https://placehold.co/400x200/111/fff?text=Vanta GT',
    description: 'Built for speed, designed for elegance.',
  },
  {
    name: 'Eclipse Hyper',
    image: 'https://placehold.co/400x200/111/fff?text=Eclipse Hyper',
    description: 'A zero-emission beast with 800hp.',
  },
];

// Options for Test Drive dropdown
testDriveOptions = this.carModels.map((model) => model.name);
}
