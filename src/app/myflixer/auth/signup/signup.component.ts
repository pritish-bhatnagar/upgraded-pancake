import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { safeReturnUrl } from '../return-url';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from 'src/app/tv-network/shared/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { mismatch: true } : null;
}

@Component({
  selector: 'app-myflixer-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class MyflixerSignupComponent {
  // ── stepper state ──────────────────────────────────────────────
  step = 0;
  readonly steps = ['Account', 'About you', 'Preferences'];

  loading = false;
  error: string | null = null;

  // ── forms, one per step ────────────────────────────────────────
  accountForm: FormGroup;
  detailsForm: FormGroup;
  prefsForm: FormGroup;

  countries = ['India', 'USA', 'Canada', 'UK', 'Germany', 'Australia', 'France', 'Japan'];
  languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' },
    { code: 'ja', label: 'Japanese' }
  ];
  interestsList = ['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Documentary', 'Sports', 'Kids', 'Horror', 'Romance', 'Thriller'];
  selectedInterests: string[] = [];

  /** Where the guard wanted to go before it bounced us here. */
  returnUrl: string | null = null;

  /** Keeps the pending destination attached when hopping to the login page. */
  get authQueryParams(): { [key: string]: string } {
    return this.returnUrl ? { returnUrl: this.returnUrl } : {};
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.returnUrl = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));

    this.accountForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordsMatch });

    this.detailsForm = this.fb.group({
      gender: [''],
      dob: [''],
      country: [''],
      phone: ['']
    });

    this.prefsForm = this.fb.group({
      language: ['en']
    });
  }

  get currentForm(): FormGroup {
    return [this.accountForm, this.detailsForm, this.prefsForm][this.step];
  }

  toggleInterest(interest: string): void {
    const i = this.selectedInterests.indexOf(interest);
    if (i === -1) this.selectedInterests.push(interest);
    else this.selectedInterests.splice(i, 1);
  }

  next(): void {
    if (this.currentForm.invalid) {
      this.currentForm.markAllAsTouched();
      return;
    }
    if (this.step < this.steps.length - 1) this.step++;
  }

  prev(): void {
    if (this.step > 0) this.step--;
  }

  async submit(): Promise<void> {
    // All step forms must be valid before creating the account.
    if (this.accountForm.invalid || this.detailsForm.invalid || this.prefsForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const userData = {
      name: this.accountForm.value.name,
      email: this.accountForm.value.email,
      password: this.accountForm.value.password,
      gender: this.detailsForm.value.gender || undefined,
      dob: this.detailsForm.value.dob || undefined,
      country: this.detailsForm.value.country || undefined,
      phone: this.detailsForm.value.phone || undefined,
      language: this.prefsForm.value.language || undefined,
      interests: this.selectedInterests
    };

    try {
      await this.authService.signUpWithEmail(userData);
      await this.authService.login(userData.email, userData.password);
      await this.authService.syncWithBackend();
      this.goOn();
    } catch (err: any) {
      this.error = this.friendlyError(err);
      this.loading = false;
    }
  }

  async signupWithGoogle(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      await this.authService.loginWithGoogle();
      await this.authService.syncWithBackend();
      this.goOn();
    } catch (err: any) {
      this.error = this.friendlyError(err);
      this.loading = false;
    }
  }

  /** Sign-up lands on the profile picker; the pending destination rides along. */
  private goOn(): void {
    this.router.navigate(['/myflixer/who'], {
      queryParams: this.returnUrl ? { returnUrl: this.returnUrl } : {},
    });
  }

  private friendlyError(err: any): string {
    const code = err?.code || '';
    if (code.includes('email-already-in-use')) return 'An account with this email already exists.';
    if (code.includes('weak-password')) return 'Password is too weak — use at least 6 characters.';
    if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) {
      return 'Sign-in was cancelled.';
    }
    if (code.includes('popup-blocked')) {
      return 'Your browser blocked the sign-in popup. Allow popups for this site and try again.';
    }
    if (code.includes('unauthorized-domain')) {
      return 'This site is not authorised for Google sign-in. Add it to Firebase Authentication → Settings → Authorized domains.';
    }
    if (code.includes('network-request-failed')) {
      return 'Network error — check your connection and try again.';
    }
    return err?.message || 'Sign up failed. Please try again.';
  }
}
