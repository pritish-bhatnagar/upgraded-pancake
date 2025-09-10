import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import { Auth, getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { firebaseConfig } from 'src/app/firebase/firebase-config';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app = initializeApp(firebaseConfig);
  private firestore = getFirestore(this.app);
  private storage = getStorage(this.app);
  private auth: Auth = getAuth(this.app);

  constructor() {}

  /**
   * Uploads media content (video/image) to Firebase Storage and adds metadata to Firestore
   */
  /**
 * Generic method to add a document to any Firestore collection.
 * Automatically adds createdAt and updatedAt timestamps.
 * @param collectionPath Path like 'shows', 'episodes', 'mediaFeed', etc.
 * @param data The data to be added
 * @param customId Optional: Provide custom ID for the document
 * @returns ID of the added document
 */
async addDocToCollection(collectionPath: string, data: any, customId?: string): Promise<string> {
  const docData = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  if (customId) {
    const docRef = doc(this.firestore, collectionPath, customId);
    await setDoc(docRef, docData);
    return customId;
  } else {
    const colRef = collection(this.firestore, collectionPath);
    const docRef = await addDoc(colRef, docData);
    return docRef.id;
  }
}

  async uploadToCloudinary(files: File[], metadata: any): Promise<void> {
    const cloudName = 'YOUR_CLOUD_NAME';
    const uploadPreset = 'YOUR_UPLOAD_PRESET'; // Create in Cloudinary settings
  
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset); // Use your upload preset 
  
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData
      });
  
      const data = await response.json();
  
      // Save media metadata to Firestore
      const contentDoc = {
        title: metadata.title,
        description: metadata.description,
        category: metadata.category,
        tags: metadata.tags || [],
        type: data.resource_type, // image / video
        mediaUrl: data.secure_url,
        uploadedAt: Timestamp.now(),
        uploadedBy: this.auth.currentUser?.uid || 'anonymous'
      };
  
      await addDoc(collection(this.firestore, 'media'), contentDoc);
    });
  
    await Promise.all(uploadPromises);
  }

  async uploadMultipleToCloudinary(files: File[]): Promise<any[]> {
    const cloudName = 'dg6ixmqvf';
    const uploadPreset = 'tvnetwork_preset';
  
    const results: any[] = [];
  
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
  
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData
      });
  
      const data = await response.json();
  
      results.push({
        url: data.secure_url,
        type: file.type.startsWith('video') ? 'video' : 'image'
      });
    }
  
    return results;
  }
  
  async saveContentMetadata(content: any): Promise<void> {
    await addDoc(collection(this.firestore, 'media'), content);
  }

  /**
   * Fetches media feed content, optionally filtered by category or tag
   */
  async getMediaFeed(category?: string, tag?: string): Promise<any[]> {
    let mediaQuery = query(collection(this.firestore, 'media'), orderBy('uploadedAt', 'desc'));

    if (category) {
      mediaQuery = query(mediaQuery, where('category', '==', category));
    }

    if (tag) {
      mediaQuery = query(mediaQuery, where('tags', 'array-contains', tag));
    }

    const snapshot = await getDocs(mediaQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Deletes media by document ID
   */
  async deleteMedia(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'media', id);
    await deleteDoc(docRef);
  }

  /**
   * Updates media metadata by ID
   */
  async updateMedia(id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, 'media', id);
    await updateDoc(docRef, data);
  }

  // Get current user
getCurrentUser(): Promise<User | null> {
  return new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(this.auth, user => {
      unsubscribe();
      resolve(user);
    });
  });
}

// Get user profile data from Firestore
async getUserProfile(userId: string): Promise<any> {
  const docRef = doc(this.firestore, 'users', userId);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
}

// Update user profile in Firestore
async updateUserProfile(userId: string, data: any): Promise<void> {
  const docRef = doc(this.firestore, 'users', userId);
  await setDoc(docRef, data, { merge: true });
}
}