import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ViewingProfileService, ViewingProfile } from '../shared/viewing-profile.service';
import { safeReturnUrl } from '../auth/return-url';

@Component({
  selector: 'app-myflixer-who',
  templateUrl: './who.component.html',
  styleUrls: ['./who.component.scss']
})
export class MyflixerWhoComponent implements OnInit {
  profiles: ViewingProfile[] = [];
  loading = true;
  error: string | null = null;

  /** Deep link the user was reaching for before auth interrupted them. */
  private returnUrl: string | null = null;

  constructor(
    private profileService: ViewingProfileService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.returnUrl = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.profileService.list().subscribe({
      next: (profiles) => {
        this.profiles = profiles;
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load profiles. Please try again.';
        this.loading = false;
      }
    });
  }

  select(profile: ViewingProfile): void {
    this.profileService.setActive(profile);
    // Picking a profile is the last gate, so this is where a deep link that was
    // interrupted by sign-in finally resumes.
    this.router.navigateByUrl(this.returnUrl ?? '/myflixer');
  }

  addProfile(): void {
    this.router.navigate(['/myflixer/manage-profiles'], { queryParams: { new: 1 } });
  }

  manage(): void {
    this.router.navigate(['/myflixer/manage-profiles']);
  }

  colorFor(p: ViewingProfile): string | null {
    return this.profileService.colorFor(p.avatar);
  }

  isUrl(p: ViewingProfile): boolean {
    return this.profileService.isUrl(p.avatar);
  }

  initial(p: ViewingProfile): string {
    return (p.name || '?').trim().charAt(0).toUpperCase();
  }
}
