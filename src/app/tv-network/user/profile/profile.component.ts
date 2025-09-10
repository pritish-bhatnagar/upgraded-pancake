import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FirebaseService } from '../../shared/firebase.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  userId: string | null = null;
  loading = true;

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.firebaseService.getCurrentUser().then(user => {
      if (user) {
        this.userId = user.uid;
        this.initForm();
        this.loadUserProfile();
      }
    });
  }

  initForm() {
    this.profileForm = this.fb.group({
      displayName: [''],
      bio: [''],
      photoURL: ['']
    });
  }

  loadUserProfile() {
    if (!this.userId) return;

    this.firebaseService.getUserProfile(this.userId).then(profile => {
      if (profile) {
        this.profileForm.patchValue(profile);
      }
      this.loading = false;
    });
  }

  async updateProfile() {
    if (!this.userId || this.profileForm.invalid) return;

    const updatedData = this.profileForm.value;
    await this.firebaseService.updateUserProfile(this.userId, updatedData);
    alert('Profile updated successfully!');
  }
}