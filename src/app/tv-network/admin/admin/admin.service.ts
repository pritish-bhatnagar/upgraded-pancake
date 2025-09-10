import { Injectable } from '@angular/core';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Tag } from '../../shared/common.model';
import { firestore } from 'src/app/firebase/firebase-config';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private tagCollection = collection(firestore, 'tags');

  async addTag(tag: Tag): Promise<void> {
    tag.createdAt = new Date().toISOString(); // Ensure createdAt is set
   // Step 1: Add the document and get the reference
  const docRef = await addDoc(this.tagCollection, tag);

  // Step 2: Update the document to include the generated ID
  await updateDoc(docRef, { id: docRef.id });
  }

  async getTags(): Promise<Tag[]> {
    const snapshot = await getDocs(this.tagCollection);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Tag[];
  }

  async addMultipleTags(tags: Tag[]) {
    for (const tag of tags) {
      await this.addTag(tag);
    }
  }

  async deleteTag(tagId: string): Promise<void> {
    const tagRef = doc(firestore, 'tags', tagId);
    await deleteDoc(tagRef);
  }
}
