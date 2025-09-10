import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AuthService } from 'src/app/tv-network/shared/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  personalInfoForm!: FormGroup;
  additionalInfoForm!: FormGroup;
  interestsForm!: FormGroup;
  isSubmitting = false;

  countries: string[] = ['India', 'USA', 'Canada', 'UK', 'Germany'];
  interestsList: string[] = ['Sports', 'Music', 'Technology', 'Movies', 'Travel', 'Art', 'Gaming'];
  selectedInterests: string[] = [];

  constructor(private fb: FormBuilder, private authService: AuthService) {}

  ngOnInit(): void {
    this.personalInfoForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.additionalInfoForm = this.fb.group({
      gender: ['', Validators.required],
      dob: ['', Validators.required],
      country: ['', Validators.required],
    });

    this.interestsForm = this.fb.group({
      interests: [[], Validators.required]
    });
  }

  toggleInterest(interest: string): void {
    const index = this.selectedInterests.indexOf(interest);
    if (index === -1) {
      this.selectedInterests.push(interest);
    } else {
      this.selectedInterests.splice(index, 1);
    }
    this.interestsForm.get('interests')?.setValue(this.selectedInterests);
  }

  submit(): void {
    if (
      this.personalInfoForm.invalid ||
      this.additionalInfoForm.invalid ||
      this.interestsForm.invalid
    ) {
      return;
    }

    this.isSubmitting = true;

    const userData = {
      name: this.personalInfoForm.value.name,
      email: this.personalInfoForm.value.email,
      password: this.personalInfoForm.value.password,
      gender: this.additionalInfoForm.value.gender,
      dob: this.additionalInfoForm.value.dob,
      country: this.additionalInfoForm.value.country,
      interests: this.selectedInterests
    };

    this.authService.signUpWithEmail(userData)
      .then(async () => {
        console.log('User signed up successfully');
        await this.authService.login(userData.email, userData.password);
      })
      .catch((error) => {
        console.error('Signup error:', error);
      })
      .finally(() => {
        this.isSubmitting = false;
      });
  }
}