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
  serverTimestamp,
  collectionGroup,
  onSnapshot,
  limit,
  startAfter
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

// ====== NEW: Catalog helpers for Home page ======
// Fetch precomputed rails document
async getHomeRails(regionId: string = 'en_IN'): Promise<{ rails: any[] } | null> {
  const d = await getDoc(doc(this.firestore, `rails/${regionId}/home/home`));
  return d.exists() ? (d.data() as any) : null;
}

// Fetch titles by ids (chunks of 10 due to Firestore 'in' limit)
async getTitlesByIds(ids: string[]): Promise<Array<{ id: string; [k: string]: any }>> {
  const out: Array<{ id: string; [k: string]: any }> = [];
  for (let i = 0; i < ids.length; i += 10) {
    const slice = ids.slice(i, i + 10);
    const q = query(collection(this.firestore, 'titles'), where('__name__', 'in', slice));
    const snap = await getDocs(q);
    snap.forEach((docSnap) => out.push({ id: docSnap.id, ...docSnap.data() }));
  }
  // preserve original order
  const map = new Map(out.map((t) => [t.id, t]));
  return ids.map((id) => map.get(id)).filter(Boolean) as any[];
}

// Stream per-user progress for Continue Watching
streamUserProgress(
  uid: string,
  onUpdate: (progress: Map<string, any>) => void
): () => void {
  const colRef = collection(this.firestore, `users/${uid}/progress`);
  return onSnapshot(colRef, (snap) => {
    const m = new Map<string, any>();
    snap.forEach((d) => m.set(d.id, d.data()));
    onUpdate(m);
  });
}

// One-shot fetch for continue watching (latest N)
async getUserProgressOnce(uid: string): Promise<Map<string, any>> {
  const colRef = collection(this.firestore, `users/${uid}/progress`);
  const snap = await getDocs(colRef);
  const m = new Map<string, any>();
  snap.forEach((d) => m.set(d.id, d.data()));
  return m;
}

// Get homepage news cards from /media where category == 'news'
async getFeaturedNews(limitCount: number = 3): Promise<any[]> {
  const qy = query(collection(this.firestore, 'media'), where('category', '==', 'news'), orderBy('uploadedAt', 'desc'));
  const snap = await getDocs(qy);
  const items = snap.docs.slice(0, limitCount).map((d) => ({ id: d.id, ...d.data() }));
  return items;
}

// Batch fetch primary assets (poster/backdrop) for many titles in one go.
// NOTE: Each asset document must include a `titleId` field equal to its parent title's id.
async getPrimaryAssetsForTitles(titleIds: string[]): Promise<Map<string, { poster?: string; backdrop?: string }>> {
  const result = new Map<string, { poster?: string; backdrop?: string }>();
  if (!Array.isArray(titleIds) || !titleIds.length) return result;

  // Firestore allows only one `in`/`array-contains-any` filter per query.
  // We'll run two queries per chunk: one for role=='poster', one for role=='backdrop'.
  const chunkSize = 10; // 'in' supports up to 10 values
  for (let i = 0; i < titleIds.length; i += chunkSize) {
    const slice = titleIds.slice(i, i + chunkSize);

    // Posters
    let qPoster = query(
      collectionGroup(this.firestore, 'assets'),
      where('titleId', 'in', slice),
      where('role', '==', 'poster')
    );
    const pSnap = await getDocs(qPoster);
    pSnap.forEach(d => {
      const a: any = d.data();
      const tId = a.titleId;
      if (!tId) return;
      const entry = result.get(tId) || {};
      entry.poster = a.url || (a.cloudinary?.publicId ? `cld:${a.cloudinary.publicId}` : entry.poster);
      result.set(tId, entry);
    });

    // Backdrops
    let qBackdrop = query(
      collectionGroup(this.firestore, 'assets'),
      where('titleId', 'in', slice),
      where('role', '==', 'backdrop')
    );
    const bSnap = await getDocs(qBackdrop);
    bSnap.forEach(d => {
      const a: any = d.data();
      const tId = a.titleId;
      if (!tId) return;
      const entry = result.get(tId) || {};
      entry.backdrop = a.url || (a.cloudinary?.publicId ? `cld:${a.cloudinary.publicId}` : entry.backdrop);
      result.set(tId, entry);
    });
  }

  return result;
}

// Fallback: per-title queries (2 queries per title). Use when collectionGroup rules/indexes block fast path.
async getPrimaryAssetsForTitlesSlow(titleIds: string[]): Promise<Map<string, { poster?: string; backdrop?: string }>> {
  const result = new Map<string, { poster?: string; backdrop?: string }>();
  for (const id of titleIds) {
    // Posters
    const ps = await getDocs(query(
      collection(this.firestore, `titles/${id}/assets`),
      where('role', '==', 'poster')
    ));
    ps.forEach((d) => {
      const a: any = d.data();
      const e = result.get(id) || {};
      e.poster = a.url || (a.cloudinary?.publicId ? `cld:${a.cloudinary.publicId}` : e.poster);
      result.set(id, e);
    });
    // Backdrops
    const bs = await getDocs(query(
      collection(this.firestore, `titles/${id}/assets`),
      where('role', '==', 'backdrop')
    ));
    bs.forEach((d) => {
      const a: any = d.data();
      const e = result.get(id) || {};
      e.backdrop = a.url || (a.cloudinary?.publicId ? `cld:${a.cloudinary.publicId}` : e.backdrop);
      result.set(id, e);
    });
  }
  return result;
}

// Safe wrapper: try fast collectionGroup; on permission errors, fall back to per-title reads.
async getPrimaryAssetsForTitlesSafe(titleIds: string[]): Promise<Map<string, { poster?: string; backdrop?: string }>> {
  try {
    return await this.getPrimaryAssetsForTitles(titleIds);
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg.includes('Missing or insufficient permissions') || msg.includes('PERMISSION_DENIED')) {
      return await this.getPrimaryAssetsForTitlesSlow(titleIds);
    }
    throw e;
  }
}
}
export const CLOUD_NAME = 'dg6ixmqvf';
export function cldImage(publicId: string, w: number, h: number, extra = "c_fill,q_auto,f_auto") {
  // https://res.cloudinary.com/<cloud>/image/upload/<transforms>/<publicId>
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${extra},w_${w},h_${h}/${publicId}`;
}

export function cldVideo(publicId: string, extra = "q_auto,f_auto") {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${extra}/${publicId}`;
}