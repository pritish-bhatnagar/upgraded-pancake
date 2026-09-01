import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { auth } from 'src/app/firebase/firebase-config';

@Injectable({
  providedIn: 'root'
})
export class MyflixerAuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    return new Promise((resolve) => {
      // onAuthStateChanged returns its own unsubscribe; without calling it the
      // guard keeps listening for the life of the app and re-navigates on every
      // later sign-out.
      // `let` + optional call: if Firebase ever fires this callback synchronously
      // during registration, `const unsub` would still be in its temporal dead
      // zone and throw, which would hang the navigation instead of resolving it.
      let unsub: (() => void) | undefined;
      unsub = auth.onAuthStateChanged((user: any) => {
        unsub?.();
        if (user) {
          resolve(true);
        } else {
          // Remember where they were headed so login can send them back.
          this.router.navigate(['/myflixer/login'], {
            queryParams: { returnUrl: state.url },
          });
          resolve(false);
        }
      });
    });
  }
}
