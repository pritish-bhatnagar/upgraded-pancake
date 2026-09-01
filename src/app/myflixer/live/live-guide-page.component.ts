import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';

/**
 * /myflixer/live — the channel guide as a page of its own.
 *
 * Thin host around the reusable LiveGuideComponent in its 'page' variant. The
 * overlay form is still used on the player itself, where opening the guide
 * must not interrupt whatever is playing.
 */
@Component({
  selector: 'app-myflixer-live-guide-page',
  template: `
    <app-live-guide [open]="true" [variant]="'page'" (closed)="back()"></app-live-guide>
  `,
  styles: [':host { display: block; background: #141414; min-height: 100svh; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyflixerLiveGuidePageComponent {
  constructor(private router: Router) {}

  back(): void {
    this.router.navigate(['/myflixer']);
  }
}
