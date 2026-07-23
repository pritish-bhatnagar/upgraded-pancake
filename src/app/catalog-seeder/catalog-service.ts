import { Injectable } from "@angular/core";
import {
  getDoc, doc, getFirestore, getDocs, collection, query, where, limit, startAfter,
  DocumentData, QueryDocumentSnapshot, onSnapshot
} from "firebase/firestore";
import { firestore } from 'src/app/firebase/firebase-config';

export type RailType = "list" | "user-progress";
export interface Rail { key: string; title: string; type: RailType; ids?: string[]; limit?: number; }
export interface RailsDoc { rails: Rail[]; updatedAt?: any; }

export interface Title {
  id: string;
  type: "movie"|"series";
  name: string;
  slug: string;
  synopsis?: string;
  year?: number;
  genres?: string[];
  tags?: string[];
  rating?: string;
  runtimeMins?: number;
  primaryPoster?: { publicId: string; aspect?: string };
  primaryBackdrop?: { publicId: string; aspect?: string };
  popularity?: number;
}

export interface Progress {
  type: "movie"|"series";
  lastPosSecs: number;
  percent?: number;
  seasonNumber?: number;
  episodeNumber?: number;
  updatedAt?: number;
}

@Injectable({ providedIn: "root" })
export class CatalogService {
  private titleCache = new Map<string, Title>();

  async getHomeRails(regionId = "en_IN"): Promise<RailsDoc | null> {
    const snap = await getDoc(doc(firestore, `rails/${regionId}/home/home`));
    return snap.exists() ? (snap.data() as RailsDoc) : null;
  }

  async getTitlesByIds(ids: string[], chunkSize = 10): Promise<Title[]> {
    // fetch in chunks of 10 (Firestore IN up to 10)
    const results: Title[] = [];
    for (let i = 0; i < ids.length; i += chunkSize) {
      const slice = ids.slice(i, i + chunkSize);
      const q = query(collection(firestore, "titles"), where("__name__", "in", slice));
      const snaps = await getDocs(q);
      snaps.forEach(d => {
        const t = { id: d.id, ...(d.data() as Omit<Title, "id">) };
        this.titleCache.set(d.id, t);
        results.push(t);
      });
    }
    // preserve original order
    const byId = new Map(results.map(r => [r.id, r]));
    return ids.map(id => byId.get(id)).filter(Boolean) as Title[];
  }

  // simple pagination helper for “long” rails you might render on separate pages
  async listByGenre(genre: string, pageSize = 24, cursor?: QueryDocumentSnapshot<DocumentData>) {
    const col = collection(firestore, "titles");
    const base = query(col, where("genres", "array-contains", genre), limit(pageSize));
    const q = cursor ? query(base, startAfter(cursor)) : base;
    const snaps = await getDocs(q);
    const items = snaps.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Title[];
    const next = snaps.docs.length === pageSize ? snaps.docs[snaps.docs.length - 1] : undefined;
    return { items, nextCursor: next };
  }

  streamUserProgress(uid: string, onUpdate: (map: Map<string, Progress>) => void, limitCount = 50) {
    const col = collection(firestore, `users/${uid}/progress`);
    // Could add orderBy("updatedAt","desc") + limit(limitCount) if you write updatedAt as a server timestamp
    return onSnapshot(col, snap => {
      const m = new Map<string, Progress>();
      snap.forEach(d => m.set(d.id, d.data() as Progress));
      onUpdate(m);
    });
  }
}