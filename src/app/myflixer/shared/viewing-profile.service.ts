import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface ViewingProfile {
  id: string;
  name: string;
  avatar: string;   // preset key ('red','blue',...) or an image URL
  isKids: boolean;
}

const ACTIVE_KEY = 'active_profile';

/** Preset avatar color keys the backend accepts, with their swatch colors. */
export const AVATAR_PRESETS: { key: string; color: string }[] = [
  { key: 'red',    color: '#e50914' },
  { key: 'blue',   color: '#0071eb' },
  { key: 'green',  color: '#2ca01c' },
  { key: 'purple', color: '#7b2ff7' },
  { key: 'orange', color: '#e87c03' },
  { key: 'teal',   color: '#08979c' },
];

@Injectable({ providedIn: 'root' })
export class ViewingProfileService {
  private readonly API = 'http://161.118.182.124:3000';

  private activeSubject = new BehaviorSubject<ViewingProfile | null>(this.readActive());
  /** Emits the currently-selected viewing profile (or null). */
  active$ = this.activeSubject.asObservable();

  constructor(private http: HttpClient) {}

  list(): Observable<ViewingProfile[]> {
    return this.http.get<ViewingProfile[]>(`${this.API}/api/v1/profiles`);
  }

  create(data: { name: string; avatar?: string; isKids?: boolean }): Observable<ViewingProfile> {
    return this.http.post<ViewingProfile>(`${this.API}/api/v1/profiles`, data);
  }

  update(id: string, data: { name?: string; avatar?: string; isKids?: boolean }): Observable<ViewingProfile> {
    return this.http.patch<ViewingProfile>(`${this.API}/api/v1/profiles/${id}`, data).pipe(
      tap((updated) => {
        // Keep the cached active profile in sync if it's the one edited.
        const active = this.activeSubject.value;
        if (active && active.id === updated.id) {
          this.setActive(updated);
        }
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/api/v1/profiles/${id}`).pipe(
      tap(() => {
        const active = this.activeSubject.value;
        if (active && active.id === id) {
          this.clearActive();
        }
      })
    );
  }

  // ── active-profile state (persisted in localStorage) ──────────────────────

  getActive(): ViewingProfile | null {
    return this.activeSubject.value;
  }

  getActiveId(): string | null {
    return this.activeSubject.value?.id ?? null;
  }

  setActive(profile: ViewingProfile): void {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(profile));
    this.activeSubject.next(profile);
  }

  clearActive(): void {
    localStorage.removeItem(ACTIVE_KEY);
    this.activeSubject.next(null);
  }

  private readActive(): ViewingProfile | null {
    try {
      const raw = localStorage.getItem(ACTIVE_KEY);
      return raw ? (JSON.parse(raw) as ViewingProfile) : null;
    } catch {
      return null;
    }
  }

  /** Resolve a profile's swatch color from its avatar key (URLs return null). */
  colorFor(avatar: string): string | null {
    const preset = AVATAR_PRESETS.find((p) => p.key === avatar);
    return preset ? preset.color : null;
  }

  /** True when the avatar is an actual image (remote URL or inline data URL) rather than a preset key. */
  isUrl(avatar: string): boolean {
    return /^https?:\/\//i.test(avatar) || /^data:image\//i.test(avatar);
  }
}
