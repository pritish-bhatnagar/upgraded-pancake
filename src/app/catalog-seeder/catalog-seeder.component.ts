import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
// import { environment } from "../../../environments/environment";
import { firestore, auth, googleProvider } from 'src/app/firebase/firebase-config';
import {
  doc, setDoc, writeBatch, serverTimestamp,
} from "firebase/firestore";
import { signInWithPopup, signOut } from "firebase/auth";

/* =========================
   Strong typing for safety
   ========================= */
interface Genre { id?: string; name: string; slug: string; order?: number; }

type AssetKind = "image" | "video" | "audio";
interface Asset {
  id?: string;
  kind: AssetKind;
  role: string;                 // poster | backdrop | banner | trailer | teaser | bts | ...
  variant?: string;             // default | hero | mobile | ...
  locale?: string | null;
  aspect?: string | null;       // "2:3", "16:9", etc.
  width?: number | null;
  height?: number | null;
  durationSec?: number | null;
  rating?: number | null;
  tags?: string[];
  cloudinary: {
    publicId: string;
    resourceType: AssetKind;
    format?: string;
    version?: number;
  };
  focal?: { x: number; y: number } | null;
}

interface Episode {
  episodeNumber: number;
  name: string;
  synopsis?: string;
  runtimeMins?: number;
  video?: any;                  // keep loose; you may define a stricter type later
}

interface Season {
  seasonNumber: number;
  name?: string;
  synopsis?: string;
  episodes?: Episode[];
}

type TitleType = "movie" | "series";
interface Title {
  id?: string;
  type: TitleType;
  name: string;
  slug: string;
  synopsis?: string;
  year?: number;
  genres?: string[];
  tags?: string[];
  rating?: string;
  runtimeMins?: number;
  primaryPoster?: any;
  primaryBackdrop?: any;
  seasons?: Season[];           // series only
  __assets?: Asset[];           // input-only; written into /assets subcollection
}

type RailType = "list" | "user-progress";
interface Rail {
  key: string;
  title: string;
  type: RailType;
  ids?: string[];               // for type: "list"
  limit?: number;               // for type: "user-progress"
}

interface Seed {
  regionId?: string;
  genres: Genre[];
  titles: Title[];
  rails:  Rail[];
}

@Component({
  selector: 'app-catalog-seeder',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './catalog-seeder.component.html',
  styleUrl: './catalog-seeder.component.scss'
})

export class CatalogSeederComponent {
  // Auth
  userEmail: string | null = null;
  isAdmin = false;

  // IO
  files: File[] = [];
  pasted = "";

  // State
  status = "";
  dryRun = true;
  parsed: Seed[] = [];
  perSeedStats: Array<{ index: number; ok: boolean; errors: string[]; stats: any }> = [];
  seeding = false;

  /* ============ Auth ============ */
  async signInGoogle() {
    const cred = await signInWithPopup(auth, googleProvider);
    this.userEmail = cred.user.email || null;
    this.isAdmin = true
     

    this.status = this.isAdmin
      ? `Signed in as ${this.userEmail} (admin)`
      : `Signed in as ${this.userEmail}. You are NOT on the admin allow-list; Firestore rules should block writes.`;
  }

  async signOutAll() {
    await signOut(auth);
    this.userEmail = null;
    this.isAdmin = false;
    this.status = "Signed out.";
  }

  /* ============ File load ============ */
  onFilesChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.files = Array.from(input.files || []);
  }

  async loadFiles() {
    if (!this.files.length) { this.status = "No files selected."; return; }
    try {
      const texts = await Promise.all(this.files.map(f => f.text()));
      const all = texts.flatMap(t => this.parseMany(t));
      this.parsed = all;
      this.status = `Loaded ${this.files.length} file(s); parsed ${all.length} seed object(s).`;
      this.validateAll();
    } catch (e: any) {
      this.status = `❌ Failed to read files: ${e?.message || e}`;
      this.parsed = [];
      this.perSeedStats = [];
    }
  }

  /* ============ Paste ============ */
  parseFromPasted() {
    try {
      const seeds = this.parseMany(this.pasted);
      this.parsed = seeds;
      this.status = `Parsed ${seeds.length} seed object(s) from pasted JSON.`;
      this.validateAll();
    } catch (e: any) {
      this.parsed = [];
      this.perSeedStats = [];
      this.status = "❌ Parse error: " + (e?.message || e);
    }
  }

  /* ============ Parse / Validate ============ */
  private parseMany(raw: string): Seed[] {
    const t = (raw || "").trim();
    if (!t) return [];
    if (t.startsWith("[")) {
      const arr = JSON.parse(t);
      if (!Array.isArray(arr)) throw new Error("Top-level JSON must be an array.");
      return arr as Seed[];
    }
    if (t.startsWith("{")) return [JSON.parse(t) as Seed];
    // JSON-Lines
    return t.split(/\r?\n/)
            .map(s => s.trim())
            .filter(Boolean)
            .map(line => JSON.parse(line) as Seed);
  }

  private validateSeedJson(seed: Seed) {
    const errors: string[] = [];

    if (!seed || typeof seed !== "object") errors.push("Root must be an object.");
    if (!Array.isArray(seed.genres)) errors.push("`genres` must be an array.");
    if (!Array.isArray(seed.titles)) errors.push("`titles` must be an array.");
    if (!Array.isArray(seed.rails))  errors.push("`rails` must be an array.");

    const titles = Array.isArray(seed.titles) ? seed.titles : [];
    const rails  = Array.isArray(seed.rails)  ? seed.rails  : [];

    const titleIds = new Set(titles.map(t => t?.id).filter(Boolean) as string[]);
    const missing: string[] = [];
    for (const r of rails) {
      if (r?.type === "list" && Array.isArray(r.ids)) {
        for (const id of r.ids) if (!titleIds.has(id)) missing.push(id);
      }
    }
    if (missing.length) {
      errors.push(`IDs in rails not present in titles: ${Array.from(new Set(missing)).join(", ")}`);
    }

    const stats = {
      regionId: seed.regionId || "en_IN",
      genres: seed.genres?.length || 0,
      titles: titles.length,
      seasons: titles.reduce((a, t) => a + (t.seasons?.length || 0), 0),
      episodes: titles.reduce((a, t) =>
        a + (t.seasons || []).reduce((b, s) => b + (s.episodes?.length || 0), 0), 0),
      assets: titles.reduce((a, t) => a + (t.__assets?.length || 0), 0),
      rails: rails.length
    };

    return { ok: errors.length === 0, errors, stats };
  }

  validateAll() {
    this.perSeedStats = [];
    const issues: string[] = [];
    for (let i = 0; i < this.parsed.length; i++) {
      const v = this.validateSeedJson(this.parsed[i]);
      this.perSeedStats.push({ index: i, ok: v.ok, errors: v.errors, stats: v.stats });
      if (!v.ok) issues.push(...v.errors.map(e => `Seed #${i + 1}: ${e}`));
    }
    this.status = issues.length ? `❌ Validation issues:\n${issues.join("\n")}` : "✅ All seeds valid.";
  }

  /* ============ Seeding (auto-creates structure) ============ */
  private readonly MAX_BATCH = 470;

  private chunk<T>(arr: T[], size: number) {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }
  private idGen() {
    return (globalThis as any).crypto?.randomUUID?.() ||
           "id_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  private stripNestedTitle(t: Title) {
    // keep only top-level fields for /titles doc; timestamps via server
    const { seasons, __assets, ...base } = t as any;
    return {
      ...base,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
  }

  async seedAll() {
    if (!this.parsed.length) { this.status = "Nothing to seed. Load or paste JSON first."; return; }
    if (!auth.currentUser) { this.status = "Please sign in first."; return; }

    this.seeding = true;
    this.status = this.dryRun ? "Dry run (no writes) …" : "Seeding to Firestore…";
    try {
      for (const seed of this.parsed) await this.seedOne(seed, { dryRun: this.dryRun });
      this.status = this.dryRun ? "✅ Dry run finished. Toggle off Dry Run to write." : "✅ Seeding complete.";
    } catch (e: any) {
      this.status = `❌ Seeding failed: ${e?.message || e}`;
      console.error(e);
    } finally {
      this.seeding = false;
    }
  }

  private async seedOne(seed: Seed, { dryRun }: { dryRun: boolean }) {
    const regionId = seed.regionId || "en_IN";
    const genres: Genre[] = Array.isArray(seed.genres) ? seed.genres : [];
    const titles: Title[] = Array.isArray(seed.titles) ? seed.titles : [];
    const rails:  Rail[]  = Array.isArray(seed.rails)  ? seed.rails  : [];

    // 1) Genres
    if (genres.length) {
      for (const chunk of this.chunk(genres, this.MAX_BATCH)) {
        if (!dryRun) {
          const batch = writeBatch(firestore);
          for (const g of chunk) {
            const id = g.id || this.idGen();
            batch.set(doc(firestore, `genres/${id}`),
              { name: g.name, slug: g.slug, order: g.order },
              { merge: true }
            );
          }
          await batch.commit();
        }
      }
    }

    // 2) Titles (top-level)
    if (titles.length) {
      const top = titles.map(t => ({ id: t.id || this.idGen(), data: this.stripNestedTitle(t) }));
      for (const chunk of this.chunk(top, this.MAX_BATCH)) {
        if (!dryRun) {
          const batch = writeBatch(firestore);
          for (const t of chunk) {
            batch.set(doc(firestore, `titles/${t.id}`), t.data, { merge: true });
          }
          await batch.commit();
        }
      }

      // 2a) Seasons & Episodes
      for (const t of titles) {
        if (!t?.id) continue;

        const seasons: Season[] = Array.isArray(t.seasons) ? t.seasons : [];
        for (const s of seasons) {
          if (!dryRun) {
            const { episodes, ...sBase } = s as any;
            await setDoc(doc(firestore, `titles/${t.id}/seasons/${s.seasonNumber}`), sBase, { merge: true });
          }

          const eps: Episode[] = Array.isArray(s.episodes) ? s.episodes : [];
          for (const chunk of this.chunk(eps, this.MAX_BATCH)) {
            if (!dryRun) {
              const batch = writeBatch(firestore);
              for (const e of chunk) {
                batch.set(
                  doc(firestore, `titles/${t.id}/seasons/${s.seasonNumber}/episodes/${e.episodeNumber}`),
                  e as any,
                  { merge: true }
                );
              }
              await batch.commit();
            }
          }
        }

        // 2b) Assets under /titles/{id}/assets/*
        const assets: Asset[] = Array.isArray(t.__assets) ? t.__assets : [];
        for (const chunk of this.chunk(assets, this.MAX_BATCH)) {
          if (!dryRun) {
            const batch = writeBatch(firestore);
            for (const a of chunk) {
              const assetId = a.id || `${a.role || "asset"}-${a.variant || "default"}-${this.idGen()}`;
              batch.set(
                doc(firestore, `titles/${t.id}/assets/${assetId}`),
                {
                  kind: a.kind,
                  role: a.role,
                  variant: a.variant || "default",
                  locale: a.locale ?? null,
                  aspect: a.aspect ?? null,
                  width: a.width ?? null,
                  height: a.height ?? null,
                  durationSec: a.durationSec ?? null,
                  rating: a.rating ?? null,
                  tags: Array.isArray(a.tags) ? a.tags : [],
                  cloudinary: a.cloudinary,
                  focal: a.focal ?? null,
                  createdAt: new Date(),
                  updatedAt: new Date()
                } as any,
                { merge: true }
              );
            }
            await batch.commit();
          }
        }
      }
    }

    // 3) Rails (experience layer)
    if (rails.length) {
      if (!dryRun) {
        await setDoc(
          doc(firestore, `rails/${regionId}/home/home`),
          { rails, updatedAt: new Date() },
          { merge: true }
        );
      }
    }
  }
}