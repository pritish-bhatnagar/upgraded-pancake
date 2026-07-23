import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from 'src/app/firebase/firebase-config';
import { doc, setDoc, serverTimestamp, getFirestore } from 'firebase/firestore';
// import { environment } from 'src/environments/environment';  // For Firebase config

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = getAuth();
  private firestore = getFirestore();
  private appInitialized = false;

  constructor(private router: Router) {
    if (!this.appInitialized) {
      initializeApp(firebaseConfig);
      this.appInitialized = true;
    }

    // Optional: auto-redirect on auth change
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        // e.g., console.log('User logged in:', user);
      } else {
        // e.g., console.log('User logged out');
      }
    });
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
  }

  async forgotPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/auth/login']);
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  onAuthStateChanged(callback: (user: User | null) => void): void {
    onAuthStateChanged(this.auth, callback);
  }

  isLoggedIn(): boolean {
    return !!this.auth.currentUser;
  }

  getUserEmail(): string | null {
    return this.auth.currentUser?.email || null;
  }

  getUserId(): string | null {
    return this.auth.currentUser?.uid || null;
  }
  async syncWithBackend(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    // Get Firebase ID token
    const firebaseToken = await user.getIdToken();

    // Send token to backend for verification and receive backend JWT
    const response = await fetch(`http://161.118.182.124:3000/api/auth/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firebaseToken}`
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      throw new Error('Failed to sync with backend');
    }

    // Extract backend-issued JWT from response
    const data = await response.json();
    if (data.token) {
      // Store backend JWT in localStorage for all subsequent API calls
      localStorage.setItem('auth_token', data.token);
    }
  }
  signUpWithEmail(userData: {
    name: string;
    email: string;
    password: string;
    gender: string;
    dob: string;
    country: string;
    interests: string[];
  }): Promise<void> {
    return createUserWithEmailAndPassword(this.auth, userData.email, userData.password)
      .then((userCredential) => {
        const user = userCredential.user;
  console.log('User signed up:', user);
        // Save user profile data to Firestore (or Realtime DB)
        const userDocRef = doc(this.firestore, `users/${user.uid}`);
        return setDoc(userDocRef, {
          uid: user.uid,
          name: userData.name,
          email: user.email,
          password: userData.password,
          gender: userData.gender,
          dob: userData.dob,
          country: userData.country,
          interests: userData.interests,
          createdAt: serverTimestamp(),
        });
      });
  }
}