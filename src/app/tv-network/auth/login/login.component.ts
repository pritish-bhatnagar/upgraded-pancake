import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/tv-network/shared/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { getAuth } from 'firebase/auth';
import { get } from 'ol/proj';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }
  
  async login() {
    this.loading = true;
    this.error = null;

    const { email, password } = this.loginForm.value;
    try {
      await this.authService.login(email, password);
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error = err.message || 'Login failed';
    } finally {
      this.loading = false;
    }
  }

  async loginWithGoogle() {
    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error = err.message || 'Google login failed';
    }
  }
}