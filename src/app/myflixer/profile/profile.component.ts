import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/tv-network/shared/auth.service';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  region: string | null;
  fullName: string | null;
  gender: string | null;
  dob: string | null;
  country: string | null;
  phone: string | null;
  language: string | null;
  interests: string[];
  roles: string[];
}

@Component({
  selector: 'app-myflixer-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class MyflixerProfileComponent implements OnInit {
  private readonly API = 'http://161.118.182.124:3000';

  profileForm: FormGroup;
  profile: UserProfile | null = null;
  loading = true;
  saving = false;
  error: string | null = null;
  saved = false;

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

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      displayName: ['', Validators.maxLength(60)],
      fullName: ['', Validators.maxLength(100)],
      gender: [''],
      dob: [''],
      country: [''],
      phone: [''],
      language: [''],
      region: ['']
    });
  }

  ngOnInit(): void {
    this.http.get<UserProfile>(`${this.API}/api/v1/users/me`).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.selectedInterests = Array.isArray(profile.interests) ? [...profile.interests] : [];
        this.profileForm.patchValue({
          displayName: profile.displayName ?? '',
          fullName: profile.fullName ?? '',
          gender: profile.gender ?? '',
          dob: profile.dob ?? '',
          country: profile.country ?? '',
          phone: profile.phone ?? '',
          language: profile.language ?? '',
          region: profile.region ?? ''
        });
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load your profile. Please try again.';
        this.loading = false;
      }
    });
  }

  get initials(): string {
    const name = this.profileForm.get('displayName')?.value || this.profile?.email || '';
    return name.trim().charAt(0).toUpperCase() || '?';
  }

  toggleInterest(interest: string): void {
    const i = this.selectedInterests.indexOf(interest);
    if (i === -1) this.selectedInterests.push(interest);
    else this.selectedInterests.splice(i, 1);
  }

  save(): void {
    if (this.profileForm.invalid) return;
    this.saving = true;
    this.error = null;
    this.saved = false;

    const v = this.profileForm.value;
    this.http.patch<UserProfile>(`${this.API}/api/v1/users/me`, {
      displayName: v.displayName || null,
      fullName: v.fullName || null,
      gender: v.gender || null,
      dob: v.dob || null,
      country: v.country || null,
      phone: v.phone || null,
      language: v.language || null,
      region: v.region || null,
      interests: this.selectedInterests
    }).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.saving = false;
        this.saved = true;
      },
      error: (err) => {
        this.error = err?.error?.error || 'Could not save your profile. Please try again.';
        this.saving = false;
      }
    });
  }

  back(): void {
    this.router.navigate(['/myflixer']);
  }
}
