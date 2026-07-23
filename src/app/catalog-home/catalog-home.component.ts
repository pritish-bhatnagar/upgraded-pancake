import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { CatalogService, Rail, Title } from "../catalog-seeder/catalog-service";
import { cldImage } from "src/app/tv-network/shared/firebase.service";
import { auth } from 'src/app/firebase/firebase-config';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

@Component({
  selector: 'app-catalog-home',
  standalone: true,
  imports: [],
  templateUrl: './catalog-home.component.html',
  styleUrl: './catalog-home.component.scss'
})
export class CatalogHomeComponent {
  loading = true;
  regionId = "en_IN";
  rails: Array<{ rail: Rail; items: Title[]; kind: "list"|"continue" }> = [];
  hero?: Title;
  userEmail?: string | null;
  private unsubProgress?: () => void;
  private progress = new Map<string, { percent?: number }>();

  constructor(private catalog: CatalogService) {}

  ngOnInit() {
    onAuthStateChanged(auth, user => {
      this.userEmail = user?.email ?? null;
      this.load();
    });
  }
  ngOnDestroy() { if (this.unsubProgress) this.unsubProgress(); }

  async load() {
    this.loading = true;
    try {
      const railsDoc = await this.catalog.getHomeRails(this.regionId);
      if (!railsDoc?.rails?.length) { this.rails = []; this.hero = undefined; this.loading = false; return; }

      const out: Array<{ rail: Rail; items: Title[]; kind: "list"|"continue" }> = [];

      // process rails sequentially to keep order
      for (const r of railsDoc.rails) {
        if (r.type === "user-progress") {
          // continue watching (only if signed in)
          if (auth.currentUser) {
            if (this.unsubProgress) this.unsubProgress();
            this.unsubProgress = this.catalog.streamUserProgress(auth.currentUser.uid, async (map) => {
              this.progress = map;
              // map to most recent IDs (we didn't sort by time here; feel free to change model to store updatedAt and sort)
              const ids = Array.from(map.keys()).slice(0, r.limit ?? 20);
              const titles = ids.length ? await this.catalog.getTitlesByIds(ids) : [];
              // attach progress percent for template
              const items = titles.map(t => ({...t, _progress: map.get(t.id)?.percent })) as any[];
              const existing = out.find(x => x.rail.key === r.key);
              if (existing) { existing.items = items; } else out.unshift({ rail: r, items, kind: "continue" });
            }, r.limit ?? 20);
          }
          continue;
        }

        // list rails with explicit IDs
        const ids = Array.isArray(r.ids) ? r.ids : [];
        const items = ids.length ? await this.catalog.getTitlesByIds(ids) : [];
        out.push({ rail: r, items, kind: "list" });
      }

      this.rails = out;
      // pick a hero from first non-empty list rail (prefer backdrop)
      const firstWithBackdrops = out.find(x => x.kind === "list" && x.items.some(it => !!it.primaryBackdrop?.publicId));
      this.hero = firstWithBackdrops?.items.find(it => !!it.primaryBackdrop?.publicId) || out[0]?.items[0];

    } finally {
      this.loading = false;
    }
  }

  posterUrl(t: Title, w = 240, h = 360) {
    const pid = t.primaryPoster?.publicId || t.primaryBackdrop?.publicId;
    return pid ? cldImage(pid, w, h) : "";
  }

  backdropUrl(t?: Title, w = 1280, h = 720) {
    const pid = t?.primaryBackdrop?.publicId || t?.primaryPoster?.publicId;
    return pid ? cldImage(pid, w, h) : "";
  }

  // simple horizontal scroll helpers
  scrollLeft(container: HTMLElement) { container.scrollBy({ left: -Math.round(container.clientWidth * 0.9), behavior: "smooth" }); }
  scrollRight(container: HTMLElement) { container.scrollBy({ left: Math.round(container.clientWidth * 0.9), behavior: "smooth" }); }

  signIn() { return signInWithPopup(auth, new GoogleAuthProvider()); }
}
