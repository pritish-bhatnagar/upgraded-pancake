import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { auth} from 'src/app/firebase/firebase-config';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): Promise<boolean> {
    
    return new Promise((resolve) => {
      auth.onAuthStateChanged( (user:  any) => {
        if (user) {
          // User is logged in
          resolve(true);
        } else {
          // Not logged in, redirect
          this.router.navigate(['/tv-network/auth/login']);
          resolve(false);
        }
      });
    });
  }
}