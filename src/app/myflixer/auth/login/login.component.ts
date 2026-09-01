import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/tv-network/shared/auth.service';
import { safeReturnUrl } from '../return-url';

@Component({
  selector: 'app-myflixer-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class MyflixerLoginComponent {
  loginForm: FormGroup;
  loading = false;
  error: string | null = null;

  /** Where the guard wanted to go before it bounced us here. */
  returnUrl: string | null = null;

  /** Keeps the pending destination attached when hopping to the signup page. */
  get authQueryParams(): { [key: string]: string } {
    return this.returnUrl ? { returnUrl: this.returnUrl } : {};
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.returnUrl = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async login() {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.error = null;

    const { email, password } = this.loginForm.value;
    try {
      await this.authService.login(email, password);
      await this.authService.syncWithBackend();
      this.goOn();
    } catch (err: any) {
      this.error = this.friendlyError(err);
    } finally {
      this.loading = false;
    }
  }

  async loginWithGoogle() {
    this.loading = true;
    this.error = null;
    try {
      await this.authService.loginWithGoogle();
      await this.authService.syncWithBackend();
      this.goOn();
    } catch (err: any) {
      this.error = this.friendlyError(err);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Sign-in always lands on the profile picker; the original destination rides
   * along so "who's watching" can finish the journey.
   */
  private goOn(): void {
    this.router.navigate(['/myflixer/who'], {
      queryParams: this.returnUrl ? { returnUrl: this.returnUrl } : {},
    });
  }

  private friendlyError(err: any): string {
    const code = err?.code || '';
    if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
      return 'Incorrect email or password.';
    }
    if (code.includes('too-many-requests')) {
      return 'Too many attempts. Please try again later.';
    }
    // Google popup flows fail in their own distinctive ways — a generic
    // "sign in failed" here sends people hunting for the wrong problem.
    if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) {
      return 'Sign-in was cancelled.';
    }
    if (code.includes('popup-blocked')) {
      return 'Your browser blocked the sign-in popup. Allow popups for this site and try again.';
    }
    if (code.includes('unauthorized-domain')) {
      return 'This site is not authorised for Google sign-in. Add it to Firebase Authentication → Settings → Authorized domains.';
    }
    if (code.includes('account-exists-with-different-credential')) {
      return 'That email is already registered with a different sign-in method. Use your email and password.';
    }
    if (code.includes('network-request-failed')) {
      return 'Network error — check your connection and try again.';
    }
    return err?.message || 'Sign in failed. Please try again.';
  }
}
