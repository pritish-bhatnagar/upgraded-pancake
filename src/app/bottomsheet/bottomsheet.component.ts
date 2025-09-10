import { Component } from '@angular/core';

@Component({
  selector: 'app-bottomsheet',
  templateUrl: './bottomsheet.component.html',
  styleUrls: ['./bottomsheet.component.scss']
})
export class BottomsheetComponent {
  isMobile = window.innerWidth < 768;
}
