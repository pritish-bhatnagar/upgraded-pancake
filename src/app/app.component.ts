import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TwitterComponent } from './twitter/twitter.component';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  @ViewChild('container', { static: true }) container!: ElementRef;
  title = 'upgraded-pancake';
  loading = false;
  clear = false;
  showNavbar = true;
  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const hiddenNavRoutes = [
          '/tv-network/user/home',
          '/soap2day',
          '/myflixer',
        ];
        this.showNavbar = !hiddenNavRoutes.includes(event.urlAfterRedirects);
      });
  }

  openDialog() {}
}
