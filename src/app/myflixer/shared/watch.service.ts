import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE = 'http://161.118.182.124:3000';

const TOKEN_KEY = 'auth_token';
const ACTIVE_PROFILE_KEY = 'active_profile';

/** Mirrors PlaybackPayload in the backend's services/watch.service.ts. */
export interface Playback {
  contentId:       string;
  title:           string;
  description:     string;
  streamUrl:       string;
  kind:            'hls' | 'mp4';
  posterUrl:       string | null;
  durationSeconds: number;
  maturityRating:  string;
  releaseYear:     number;
  /** Where to seek on load — 0 for a fresh start or a finished title. */
  resumeSeconds:   number;
  completed:       boolean;
}

@Injectable({ providedIn: 'root' })
export class WatchService {
  constructor(private http: HttpClient) {}

  /** Everything the player needs to start a title, in one round trip. */
  getPlayback(contentId: string): Observable<Playback> {
    return this.http.get<Playback>(`${API_BASE}/api/v1/watch/${encodeURIComponent(contentId)}`);
  }

  /**
   * Player heartbeat. The player already throttles its progress output to once
   * every 5s, so this goes straight out — no extra debouncing here.
   */
  saveProgress(contentId: string, positionSeconds: number, durationSeconds: number): Observable<void> {
    return this.http.put<void>(
      `${API_BASE}/api/v1/watch/${encodeURIComponent(contentId)}/progress`,
      { positionSeconds, durationSeconds, deviceType: this.deviceType() },
    );
  }

  /**
   * Last-gasp save for teardown (tab close, back button, route change). An
   * HttpClient request started here would be cancelled mid-flight when the page
   * goes away; `keepalive` lets the browser finish it on its own. sendBeacon
   * can't be used — it cannot carry the Authorization header.
   *
   * The interceptor isn't in play on this path, so the token and profile header
   * are read from localStorage directly.
   */
  saveProgressBeacon(contentId: string, positionSeconds: number, durationSeconds: number): void {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    const profileId = this.activeProfileId();
    if (profileId) headers['X-Profile-Id'] = profileId;

    try {
      fetch(`${API_BASE}/api/v1/watch/${encodeURIComponent(contentId)}/progress`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ positionSeconds, durationSeconds, deviceType: this.deviceType() }),
        keepalive: true,
      }).catch(() => { /* teardown path — nothing useful to do with a failure */ });
    } catch {
      /* ignore */
    }
  }

  private deviceType(): string {
    return window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'web';
  }

  private activeProfileId(): string | null {
    try {
      const raw = localStorage.getItem(ACTIVE_PROFILE_KEY);
      return raw ? (JSON.parse(raw)?.id ?? null) : null;
    } catch {
      return null;
    }
  }
}
