import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ViewingProfileService, ViewingProfile, AVATAR_PRESETS } from '../shared/viewing-profile.service';
import { ImageUploadService } from '../shared/image-upload.service';

@Component({
  selector: 'app-myflixer-manage-profiles',
  templateUrl: './manage-profiles.component.html',
  styleUrls: ['./manage-profiles.component.scss']
})
export class MyflixerManageProfilesComponent implements OnInit {
  readonly presets = AVATAR_PRESETS;

  profiles: ViewingProfile[] = [];
  loading = true;
  error: string | null = null;
  saving = false;

  // Editor state — null when the list is showing, populated when adding/editing.
  editing: {
    id: string | null;
    name: string;
    avatar: string;
    isKids: boolean;
  } | null = null;

  uploading = false;
  /** The "View / Change / Remove" menu that opens when the avatar circle is tapped. */
  avatarMenuOpen = false;
  /** Full-size preview shown by "View photo". */
  viewingPhoto: string | null = null;

  constructor(
    private profileService: ViewingProfileService,
    private imageUpload: ImageUploadService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.load(() => {
      if (this.route.snapshot.queryParamMap.get('new')) {
        this.startAdd();
      }
    });
  }

  load(done?: () => void): void {
    this.loading = true;
    this.profileService.list().subscribe({
      next: (profiles) => {
        this.profiles = profiles;
        this.loading = false;
        done?.();
      },
      error: () => {
        this.error = 'Could not load profiles.';
        this.loading = false;
      }
    });
  }

  get canAdd(): boolean {
    return this.profiles.length < 5;
  }

  startAdd(): void {
    this.editing = { id: null, name: '', avatar: 'red', isKids: false };
  }

  startEdit(p: ViewingProfile): void {
    this.editing = { id: p.id, name: p.name, avatar: p.avatar, isKids: p.isKids };
  }

  cancelEdit(): void {
    this.editing = null;
    this.error = null;
    this.closeAvatarMenu();
  }

  pickAvatar(key: string): void {
    if (this.editing) this.editing.avatar = key;
  }

  /** Tapping the avatar circle opens the photo menu (no separate upload button). */
  toggleAvatarMenu(): void {
    this.avatarMenuOpen = !this.avatarMenuOpen;
  }

  closeAvatarMenu(): void {
    this.avatarMenuOpen = false;
  }

  get hasPhoto(): boolean {
    return !!this.editing && this.isUrl(this.editing.avatar);
  }

  viewPhoto(): void {
    if (this.editing && this.hasPhoto) this.viewingPhoto = this.editing.avatar;
    this.closeAvatarMenu();
  }

  closeViewer(): void {
    this.viewingPhoto = null;
  }

  removePhoto(): void {
    if (this.editing) this.editing.avatar = 'red';
    this.closeAvatarMenu();
  }

  async onAvatarSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.editing) return;

    this.uploading = true;
    this.error = null;
    this.closeAvatarMenu();
    try {
      const { url } = await this.imageUpload.uploadAvatar(file, 'profile-avatars');
      this.editing.avatar = url;
    } catch (err: any) {
      this.error = err?.message || 'Could not upload that image.';
    } finally {
      this.uploading = false;
      input.value = '';
    }
  }

  save(): void {
    if (!this.editing) return;
    const name = this.editing.name.trim();
    if (!name) {
      this.error = 'Please enter a name.';
      return;
    }

    this.saving = true;
    this.error = null;
    const payload = { name, avatar: this.editing.avatar, isKids: this.editing.isKids };

    const request = this.editing.id
      ? this.profileService.update(this.editing.id, payload)
      : this.profileService.create(payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.editing = null;
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.error || 'Could not save the profile.';
      }
    });
  }

  remove(p: ViewingProfile): void {
    if (!confirm(`Delete the profile "${p.name}"? This can't be undone.`)) return;
    this.profileService.delete(p.id).subscribe({
      next: () => this.load(),
      error: () => { this.error = 'Could not delete the profile.'; }
    });
  }

  done(): void {
    this.router.navigate(['/myflixer/who']);
  }

  colorFor(p: ViewingProfile): string | null {
    return this.profileService.colorFor(p.avatar);
  }
  colorForKey(avatar: string): string | null {
    return this.profileService.colorFor(avatar);
  }
  isUrl(avatar: string): boolean {
    return this.profileService.isUrl(avatar);
  }
  initial(name: string): string {
    return (name || '?').trim().charAt(0).toUpperCase();
  }
}
