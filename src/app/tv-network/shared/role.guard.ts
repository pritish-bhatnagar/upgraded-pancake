import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user && user.role === 'admin') return true;
    this.router.navigate(['/user/home']);
    return false;
  }
}