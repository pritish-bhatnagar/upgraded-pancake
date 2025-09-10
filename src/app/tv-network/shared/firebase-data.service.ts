import { Injectable } from '@angular/core';
import {
  collection,
  collectionGroup,
  getDocs,
  getFirestore,
  query,
  where
} from 'firebase/firestore';
// import { firestore } from 'src/environments/firebase-config';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { firestore } from 'src/app/firebase/firebase-config';
import { Tag } from './common.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseDataService {
//   private firestore = getFirestore(app);
  // constructor() {}

  // // async getTagsCollection() : Promise<any> {
  // //   const snapshot = await getDocs(collection(firestore, 'tags'));
  // //   return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  // // }
  
  // async getShowsByTag(tag: string) {
  //   const snapshot = await getDocs(
  //     query(collection(firestore, 'shows'), where('tags', 'array-contains', tag))
  //   );
  //   return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  // }

  // async getEpisodesByTag(tag: string) {
  //   const snapshot = await getDocs(
  //     collectionGroup(firestore, 'episodes')
  //   );
  //   return snapshot.docs
  //     .filter((doc) => (doc.data()?.['tags'] || []).includes(tag))
  //     .map((doc) => ({ id: doc.id, ...doc.data() }));
  // }

  // async getMediaByTag(tag: string) {
  //   const snapshot = await getDocs(
  //     collectionGroup(firestore, 'shows/media')
  //   );
  //   return snapshot.docs
  //     .filter((doc) => (doc.data()?.['tags'] || []).includes(tag))
  //     .map((doc) => ({ id: doc.id, ...doc.data() }));
  // }

  // getMediaForShow(): Promise<any[]> {
  //   const mediaRef = collection(firestore, `shows`);
  //   return getDocs(mediaRef).then(snapshot =>
  //     snapshot.docs.map(doc => ({
  //       id: doc.id,
  //       ...doc.data()
  //     }))
  //   );
  // }
  constructor() {}

  // ✅ Get all shows by tag (e.g., 'trending', 'hero slide', etc.)
  async getShowsByTag(tag: string): Promise<any[]> {
    const showRef = collection(firestore, 'shows');
    const showQuery = query(showRef, where('tags', 'array-contains', tag));
    const snap = await getDocs(showQuery);

    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  // ✅ Get media files for a specific show by category (e.g., 'Poster', 'Banner', etc.)
  async getMediaForShowByCategory(showId: string, category: string): Promise<any[]> {
    const mediaRef = collection(firestore, 'shows/' + showId + '/media');
    const mediaQuery = query(
      mediaRef,
      where('category', '==', category)
    );
    const snap = await getDocs(mediaQuery);

    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  // ✅ Get episodes tagged with a specific tag (e.g., for episodes with showOnHome = true)
  async getEpisodesByTag(tag: string): Promise<any[]> {
    const episodesRef = collection(firestore, 'episodes');
    const episodeQuery = query(episodesRef, where('tags', 'array-contains', tag));
    const snap = await getDocs(episodeQuery);

    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  // ✅ (Optional) Get all tags (if not already handled in adminService)
  async getAllTags(): Promise<any[]> {
    const tagsRef = collection(firestore, 'tags');
    const tagDocs = await getDocs(tagsRef);

    return tagDocs.docs.map(doc => doc.data());
  }
}