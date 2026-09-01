import { Injectable, Injector } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../tv-network/shared/auth.service';

/** Only requests to our own backend get the token — never third-party APIs. */
const API_BASE = 'http://161.118.182.124:3000';

const ACTIVE_PROFILE_KEY = 'active_profile';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  // Injector rather than AuthService directly: interceptors are constructed as
  // part of HttpClient's own DI graph, so lazy lookup avoids any cycle.
  constructor(private injector: Injector) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!req.url.startsWith(API_BASE)) {
      return next.handle(req);
    }

    const auth = this.injector.get(AuthService);

    // Waiting on ensureBackendToken() is what fixes "could not load profile" on
    // first login: the request now waits for the JWT instead of racing it.
    return from(auth.ensureBackendToken()).pipe(
      switchMap((token) => next.handle(this.decorate(req, token))),
      catchError((err: HttpErrorResponse) => {
        if (err.status !== 401) return throwError(() => err);

        // Stale or expired token — mint a fresh one and retry exactly once.
        return from(auth.refreshBackendToken()).pipe(
          switchMap((token) =>
            token ? next.handle(this.decorate(req, token)) : throwError(() => err)
          )
        );
      })
    );
  }

  private decorate(req: HttpRequest<any>, token: string | null): HttpRequest<any> {
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Scopes watch history / continue-watching to the viewing profile that's
    // currently selected, rather than to the account as a whole.
    const profileId = this.activeProfileId();
    if (profileId) {
      headers['X-Profile-Id'] = profileId;
    }

    return Object.keys(headers).length ? req.clone({ setHeaders: headers }) : req;
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
