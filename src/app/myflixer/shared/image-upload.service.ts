import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface UploadResult {
  /** Usable directly as an <img src> / CSS url() — a Cloudinary-hosted image URL. */
  url: string;
  /**
   * Kept for backward compatibility with callers. Always false now: the image is
   * hosted on Cloudinary (via our backend), never embedded inline in the document.
   */
  storedInline: boolean;
}

/** Our own backend — the ONLY host the browser sends the image to. It uploads to Cloudinary. */
const API_BASE = 'http://161.118.182.124:3000';

const MAX_SOURCE_BYTES = 10 * 1024 * 1024;   // reject absurd originals before decoding
const MAX_EDGE_PX = 400;                     // avatars never need more than this
const JPEG_QUALITY = 0.85;

@Injectable({ providedIn: 'root' })
export class ImageUploadService {
  constructor(private http: HttpClient) {}

  /**
   * Downscales the picked image, then hands the bytes to our backend, which
   * uploads them to Cloudinary and returns the hosted URL. The caller saves that
   * URL on the viewing profile (via the /profiles API → Firestore).
   *
   * The browser never talks to Cloudinary or Firebase Storage directly — only to
   * our backend, authenticated with the backend JWT that the auth interceptor
   * attaches to requests bound for API_BASE.
   */
  async uploadAvatar(file: File, _folder: string): Promise<UploadResult> {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please choose an image file.');
    }
    if (file.size > MAX_SOURCE_BYTES) {
      throw new Error('That image is too large — please pick one under 10MB.');
    }

    const { dataUrl } = await this.downscale(file);

    const res = await firstValueFrom(
      this.http.post<{ url: string }>(`${API_BASE}/api/v1/media/avatar`, { image: dataUrl })
    );

    if (!res?.url) {
      throw new Error('Upload did not return an image URL.');
    }
    return { url: res.url, storedInline: false };
  }

  /** Draws the image onto a canvas at a capped size and re-encodes it as JPEG. */
  private async downscale(file: File): Promise<{ dataUrl: string }> {
    const sourceUrl = await this.readAsDataUrl(file);
    const img = await this.loadImage(sourceUrl);

    const scale = Math.min(1, MAX_EDGE_PX / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not process that image.');
    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    return { dataUrl };
  }

  private readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Could not read that file.'));
      reader.readAsDataURL(file);
    });
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('That file does not look like a valid image.'));
      img.src = src;
    });
  }
}
