import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE = 'http://161.118.182.124:3000';

/** Mirrors NowPlaying in the backend's domain/channel.ts. */
export interface NowPlaying {
  title:    string;
  startsAt: string;
  endsAt:   string;
}

/** Mirrors LiveChannelStatus in the backend's domain/channel.ts. */
export interface LiveChannel {
  id:          string;
  name:        string;
  description: string;
  category:    string;
  logoUrl:     string | null;
  streamUrl:   string;
  language:    string;
  sortOrder:   number;
  /** Probed by the backend when the guide was built — not a stored flag. */
  isLive:      boolean;
  checkedAt:   string;
  /** 'studio' channels are MyFlixer creators broadcasting via OBS. */
  source:      'external' | 'studio';
  /** Only known for 'studio' channels — third-party CDNs don't report it. */
  viewers:     number | null;
  startedAt:   string | null;
  /**
   * What is on right now, when a programme guide covers this channel. Roughly
   * half the lineup has no guide source, so this is null often enough that the
   * UI must always have something else to show.
   */
  nowPlaying:  NowPlaying | null;
}

/** Mirrors ChannelPage in the backend's services/live.service.ts. */
export interface ChannelGuide {
  channels:   LiveChannel[];
  /** Live channels across the whole filtered set, not just this page. */
  liveCount:  number;
  /** Filtered size — what the pager counts against. */
  totalCount: number;
  page:       number;
  pageSize:   number;
  pageCount:  number;
  hasMore:    boolean;
}

/** Narrowing sent to the guide endpoint. All fields optional. */
export interface ChannelQuery {
  query?:    string;
  category?: string | null;
  language?: string | null;
  liveOnly?: boolean;
  page?:     number;
}

/** Mirrors LivePlayback in the backend's services/live.service.ts. */
export interface LivePlayback {
  channelId:   string;
  name:        string;
  description: string;
  category:    string;
  logoUrl:     string | null;
  streamUrl:   string;
  kind:        'hls';
  isLive:      true;
  source:      'external' | 'studio';
  nowPlaying:  NowPlaying | null;
}

@Injectable({ providedIn: 'root' })
export class LiveService {
  constructor(private http: HttpClient) {}

  /**
   * One page of the channel guide. Filtering is server-side across the whole
   * lineup — `query` over name, category and description, `category` and
   * `language` as exact matches, `liveOnly` dropping streams that didn't
   * answer — so paging never hides a match that lives on another page.
   */
  search(q: ChannelQuery = {}): Observable<ChannelGuide> {
    const params: Record<string, string> = {};
    if (q.query?.trim()) params['q'] = q.query.trim();
    if (q.category)      params['category'] = q.category;
    if (q.language)      params['language'] = q.language;
    if (q.liveOnly)      params['liveOnly'] = 'true';
    if (q.page && q.page > 1) params['page'] = String(q.page);

    return this.http.get<ChannelGuide>(`${API_BASE}/api/v1/live/channels`, { params });
  }

  categories(): Observable<{ categories: string[] }> {
    return this.http.get<{ categories: string[] }>(`${API_BASE}/api/v1/live/categories`);
  }

  languages(): Observable<{ languages: string[] }> {
    return this.http.get<{ languages: string[] }>(`${API_BASE}/api/v1/live/languages`);
  }

  /** Resolve one channel into a playable stream. 409 = off air. */
  getPlayback(channelId: string): Observable<LivePlayback> {
    return this.http.get<LivePlayback>(
      `${API_BASE}/api/v1/live/channels/${encodeURIComponent(channelId)}`
    );
  }
}
