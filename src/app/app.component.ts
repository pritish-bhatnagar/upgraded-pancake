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
  /**
   * The site-wide bottom sheet is a CBS-branded footer belonging to the other
   * demo apps in this workspace. It renders on every route, so it was landing
   * underneath the MyFlixer player — scrolling the page to it whenever a video
   * or live channel opened. Hidden across the section for the same reason as
   * the navbar: MyFlixer brings its own chrome.
   */
  showFooter = true;
  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const hiddenNavRoutes = ['/soap2day'];
        const url: string = event.urlAfterRedirects;
        // MyFlixer brings its own header on every screen, so the site navbar is
        // hidden across the whole section. One prefix test rather than a list
        // of exact paths plus a growing set of startsWith checks: routes
        // carrying ids (/watch/:id, /live/:id) and any route added later are
        // covered automatically. Query strings are stripped first, since
        // /myflixer/who?returnUrl=… must still match.
        const path = url.split('?')[0];
        const inMyflixer = path === '/myflixer' || path.startsWith('/myflixer/');
        this.showNavbar = !inMyflixer && !hiddenNavRoutes.includes(path);
        this.showFooter = !inMyflixer;
      });
  }

  openDialog() {}
}
