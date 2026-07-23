import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, Input } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { StepperOrientation } from '@angular/material/stepper';
// import { AuthService } from 'src/app/auth.service';

import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile, User } from 'firebase/auth';
import { map, Observable } from 'rxjs';
import { auth, googleProvider } from 'src/app/firebase/firebase-config'

@Component({
  selector: 'app-firebase',
  templateUrl: './firebase.component.html',
  styleUrls: ['./firebase.component.scss']
})
export class FirebaseComponent {
  // constructor(private auth: Auth) {}
  @Input() showNavbar = true;
  isLogin = false;
  user: any = null;
  // email: string;
  // password: string;
  errorMessage: any;
  newDisplayName: string;
  feedbackMessage: string;
  stepperOrientation: Observable<StepperOrientation>;

  firstFormGroup = this._formBuilder.group({
    firstCtrlEmail: ['', Validators.email],
    firstCtrlPassword: ['', Validators.required],
  });
  secondFormGroup = this._formBuilder.group({
    secondCtrl: ['', Validators.required],
  });
  thirdFormGroup = this._formBuilder.group({
    thirdCtrl: ['', Validators.required],
  });


  constructor( private _formBuilder: FormBuilder,
    breakpointObserver: BreakpointObserver,) {
      this.stepperOrientation = breakpointObserver
      .observe('(min-width: 800px)')
      .pipe(map(({matches}) => (matches ? 'horizontal' : 'vertical')));
    this.user = this.getUser();
    auth.onAuthStateChanged(user => {
      this.user = user;
    });
  }

  async signIn() {
    const user = await this.signInWithGoogle();
    if (user) {
      // const credential = GoogleAuthProvider.credentialFromResult(user);
    // const token = credential.accessToken;
      this.user = user;
    }
  }

  async signUp(event: Event) {
   console.log( this.firstFormGroup.value.firstCtrlEmail)
    createUserWithEmailAndPassword(auth, this.firstFormGroup.value.firstCtrlEmail, this.firstFormGroup.value.firstCtrlPassword)
  .then((userCredential) => {
    // Signed up 
    const user = userCredential.user;
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
     this.errorMessage = error.message;
    // ..
  });
  }

  async login(event: Event): Promise<User | null> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, this.firstFormGroup.value.firstCtrlEmail,this.firstFormGroup.value.firstCtrlPassword);
      return userCredential.user;
    } catch (error) {
      this.errorMessage = error.message;
      return null;
    }
  }

  async signInWithGoogle(): Promise<User | null> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      this.user = result.user;
      return result.user;
    } catch (error) {
      this.errorMessage = error.message;
      return null;
    }
  }

  async logout(): Promise<void> {
    await signOut(auth);
    this.user = null;
  }

  getUser(): User | null {
    return this.user;
  }

  setDisplayName() {
    if (this.newDisplayName.trim() && this.user) {
      updateProfile(this.user, {
        displayName: this.newDisplayName,
      })
        .then(() => {
          this.feedbackMessage = 'Display name updated successfully!';
          this.newDisplayName = ''; // Clear input field
        })
        .catch((error) => {
          this.feedbackMessage = `Error updating display name: ${error.message}`;
          console.error('Error updating display name:', error);
        });
    }
  }

  
}
