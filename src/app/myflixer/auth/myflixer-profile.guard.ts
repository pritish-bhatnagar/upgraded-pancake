import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { auth } from 'src/app/firebase/firebase-config';
import { ViewingProfileService } from '../shared/viewing-profile.service';

/**
 * Guards the main browse page: the user must be logged in AND have picked a
 * viewing profile. Missing auth → login; missing profile → "who's watching".
 *
 * Either way the destination travels along as `returnUrl`, so a deep link
 * (say /myflixer/live/nasa-tv-public) survives the detour and resumes once the
 * user is through.
 */
@Injectable({ providedIn: 'root' })
export class MyflixerProfileGuard implements CanActivate {
  constructor(private router: Router, private profiles: ViewingProfileService) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    return new Promise((resolve) => {
      // `let` + optional call: if Firebase ever fires this callback synchronously
      // during registration, `const unsub` would still be in its temporal dead
      // zone and throw, which would hang the navigation instead of resolving it.
      let unsub: (() => void) | undefined;
      unsub = auth.onAuthStateChanged((user: any) => {
        unsub?.();
        if (!user) {
          this.router.navigate(['/myflixer/login'], {
            queryParams: { returnUrl: state.url },
          });
          resolve(false);
          return;
        }
        if (!this.profiles.getActiveId()) {
          this.router.navigate(['/myflixer/who'], {
            queryParams: { returnUrl: state.url },
          });
          resolve(false);
          return;
        }
        resolve(true);
      });
    });
  }
}
