import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

const API_BASE = 'http://161.118.182.124:3000';

/** Mirrors StreamingStatus in the backend's domain/studio-channel.ts. */
export type StreamingStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'suspended';

/** Mirrors OwnedChannel in the backend's services/studio.service.ts. */
export interface StudioChannel {
  id:              string;   // equal to `handle`
  ownerUid:        string;
  handle:          string;
  name:            string;
  description:     string;
  category:        string;
  logoUrl:         string | null;
  streamingStatus: StreamingStatus;
  requestedAt:     string | null;
  reviewedAt:      string | null;
  reviewedBy:      string | null;
  rejectionReason: string | null;
  canBroadcast:    boolean;
  createdAt:       string;
  updatedAt:       string;
}

/** What OBS needs. `streamKey` is a live credential — never log or display it
 *  unmasked without the user asking. */
export interface IngestSettings {
  server:      string;
  streamKey:   string;
  playbackUrl: string;
}

/** Live state as reported by the media server itself. */
export interface BroadcastStatus {
  channelId:   string;
  isLive:      boolean;
  startedAt:   string | null;
  uptime:      number;
  viewers:     number;
  resolution:  string | null;
  playbackUrl: string;
}

export interface CreateChannelInput {
  handle:       string;
  name:         string;
  description?: string;
  category?:    string;
  logoUrl?:     string | null;
}

@Injectable({ providedIn: 'root' })
export class StudioService {
  constructor(private http: HttpClient) {}

  // ── Creator ────────────────────────────────────────────────────────────────

  myChannels(): Observable<StudioChannel[]> {
    return this.http
      .get<{ channels: StudioChannel[] }>(`${API_BASE}/api/v1/studio/channels/mine`)
      .pipe(map(r => r.channels ?? []));
  }

  getChannel(id: string): Observable<StudioChannel> {
    return this.http.get<StudioChannel>(`${API_BASE}/api/v1/studio/channels/${encodeURIComponent(id)}`);
  }

  create(input: CreateChannelInput): Observable<StudioChannel> {
    return this.http.post<StudioChannel>(`${API_BASE}/api/v1/studio/channels`, input);
  }

  update(id: string, patch: Partial<CreateChannelInput>): Observable<StudioChannel> {
    return this.http.patch<StudioChannel>(`${API_BASE}/api/v1/studio/channels/${encodeURIComponent(id)}`, patch);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/api/v1/studio/channels/${encodeURIComponent(id)}`);
  }

  requestAccess(id: string): Observable<StudioChannel> {
    return this.http.post<StudioChannel>(
      `${API_BASE}/api/v1/studio/channels/${encodeURIComponent(id)}/request-access`, {},
    );
  }

  /** 403 until an admin approves the channel. */
  ingest(id: string): Observable<IngestSettings> {
    return this.http.get<IngestSettings>(`${API_BASE}/api/v1/studio/channels/${encodeURIComponent(id)}/ingest`);
  }

  rotateKey(id: string): Observable<IngestSettings> {
    return this.http.post<IngestSettings>(
      `${API_BASE}/api/v1/studio/channels/${encodeURIComponent(id)}/ingest/rotate`, {},
    );
  }

  status(id: string): Observable<BroadcastStatus> {
    return this.http.get<BroadcastStatus>(`${API_BASE}/api/v1/studio/channels/${encodeURIComponent(id)}/status`);
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  requests(status: StreamingStatus = 'pending'): Observable<StudioChannel[]> {
    return this.http
      .get<{ channels: StudioChannel[] }>(`${API_BASE}/api/v1/admin/studio/requests`, { params: { status } })
      .pipe(map(r => r.channels ?? []));
  }

  approve(id: string): Observable<StudioChannel> {
    return this.http.post<StudioChannel>(`${API_BASE}/api/v1/admin/studio/channels/${encodeURIComponent(id)}/approve`, {});
  }

  reject(id: string, reason: string): Observable<StudioChannel> {
    return this.http.post<StudioChannel>(`${API_BASE}/api/v1/admin/studio/channels/${encodeURIComponent(id)}/reject`, { reason });
  }

  suspend(id: string, reason: string): Observable<StudioChannel> {
    return this.http.post<StudioChannel>(`${API_BASE}/api/v1/admin/studio/channels/${encodeURIComponent(id)}/suspend`, { reason });
  }

  /** Roles live on the user record, not in the JWT, so the UI asks for them. */
  isAdmin(): Observable<boolean> {
    return this.http
      .get<{ roles?: string[] }>(`${API_BASE}/api/v1/users/me`)
      .pipe(map(u => (u.roles ?? []).includes('admin')));
  }
}
