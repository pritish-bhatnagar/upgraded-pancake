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
  private pendingTokenSync: Promise<string | null> | null = null;

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
    localStorage.removeItem('auth_token');
    this.pendingTokenSync = null;
    this.router.navigate(['/myflixer/login']);
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
  /**
   * Resolves once Firebase has finished restoring its persisted session, so
   * callers don't race the cold-start auth state (which is briefly null).
   */
  private authReady(): Promise<void> {
    const anyAuth = this.auth as any;
    if (typeof anyAuth.authStateReady === 'function') {
      return anyAuth.authStateReady();
    }
    return new Promise<void>((resolve) => {
      const unsub = onAuthStateChanged(this.auth, () => { unsub(); resolve(); });
    });
  }

  /**
   * Returns a usable backend JWT, minting one first if it's missing.
   *
   * The app previously fired API calls before syncWithBackend() had stored the
   * token, which showed up as "could not load profile" on first login until you
   * refreshed. Concurrent callers all share a single in-flight sync.
   */
  ensureBackendToken(): Promise<string | null> {
    const existing = localStorage.getItem('auth_token');
    if (existing) return Promise.resolve(existing);
    if (this.pendingTokenSync) return this.pendingTokenSync;

    this.pendingTokenSync = (async () => {
      try {
        await this.authReady();
        if (!this.auth.currentUser) return null;
        await this.syncWithBackend();
        return localStorage.getItem('auth_token');
      } catch {
        return null;
      } finally {
        this.pendingTokenSync = null;
      }
    })();

    return this.pendingTokenSync;
  }

  /** Throws away the cached JWT and mints a fresh one — used after a 401. */
  refreshBackendToken(): Promise<string | null> {
    localStorage.removeItem('auth_token');
    this.pendingTokenSync = null;
    return this.ensureBackendToken();
  }

  signUpWithEmail(userData: {
    name: string;
    email: string;
    password: string;
    gender?: string;
    dob?: string;
    country?: string;
    phone?: string;
    language?: string;
    interests?: string[];
  }): Promise<void> {
    return createUserWithEmailAndPassword(this.auth, userData.email, userData.password)
      .then((userCredential) => {
        const user = userCredential.user;
  console.log('User signed up:', user);
        // Save user profile data to Firestore. Field names here must match what
        // the backend's user.repo.firestore toUser() maps (displayName/fullName
        // fall back to `name`).
        const userDocRef = doc(this.firestore, `users/${user.uid}`);
        return setDoc(userDocRef, {
          uid: user.uid,
          name: userData.name,
          displayName: userData.name,
          fullName: userData.name,
          email: user.email,
          gender: userData.gender ?? null,
          dob: userData.dob ?? null,
          country: userData.country ?? null,
          phone: userData.phone ?? null,
          language: userData.language ?? null,
          interests: userData.interests ?? [],
          roles: ['user'],
          createdAt: serverTimestamp(),
        });
      });
  }
}