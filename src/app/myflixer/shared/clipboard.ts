// ─────────────────────────────────────────────────────────────────────────────
// shared/clipboard.ts
// Copy and share that actually work on this deployment.
//
// navigator.clipboard and navigator.share are both gated on a *secure context*
// — HTTPS, or localhost. MyFlixer is served over plain http:// on an IP
// (pm2 serve on :4201, nginx TLS disabled), so in a real browser both objects
// are simply `undefined`. The previous code did:
//
//     navigator.clipboard?.writeText(url).then(...)
//
// where the optional chain yields undefined and `.then` on it throws a
// TypeError — which is why the share and copy buttons did nothing at all, with
// no visible error.
//
// So: try the modern API, fall back to the execCommand('copy') textarea trick.
// That one is deprecated but has no secure-context requirement and still works
// in every current browser. Serving the app over TLS turns the fallback into
// dead code, which is the real long-term fix.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Copy text to the clipboard. Resolves false only if both paths failed, so the
 * caller can say so rather than showing a confirmation that didn't happen.
 */
export async function copyText(text: string): Promise<boolean> {
  // Modern path — HTTPS or localhost only.
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission denied, or the document wasn't focused. Fall through.
    }
  }
  return legacyCopy(text);
}

/**
 * The pre-2018 copy path. Needs a real, selectable, on-screen element — a
 * display:none element cannot hold a selection — so the textarea is parked
 * off-viewport instead of hidden.
 *
 * Stays synchronous on purpose: execCommand needs the user gesture that is
 * still active on this tick, and an await before it would lose that.
 */
function legacyCopy(text: string): boolean {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top      = '0';
  ta.style.left     = '-9999px';
  ta.style.opacity  = '0';
  document.body.appendChild(ta);

  // Preserve whatever the viewer had selected — clobbering it would be rude.
  const selection = document.getSelection();
  const previous  = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  try {
    ta.select();
    ta.setSelectionRange(0, ta.value.length);   // iOS ignores select() on its own
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(ta);
    if (previous && selection) {
      selection.removeAllRanges();
      selection.addRange(previous);
    }
  }
}

/** What actually happened, so the caller can word its toast honestly. */
export type ShareOutcome = 'shared' | 'copied' | 'failed';

export interface ShareData {
  title: string;
  text:  string;
  url:   string;
}

/**
 * Hand the link to the OS share sheet where there is one, otherwise put it on
 * the clipboard. On this http:// deployment it is always the clipboard.
 */
export async function shareOrCopy(data: ShareData): Promise<ShareOutcome> {
  const nav = navigator as Navigator & { share?: (d: unknown) => Promise<void> };

  if (nav.share) {
    try {
      await nav.share(data);
      return 'shared';
    } catch (err) {
      // A dismissed sheet rejects with AbortError. That is a choice, not a
      // failure — quietly copying instead would be a surprise.
      if ((err as DOMException)?.name === 'AbortError') return 'shared';
      // Anything else (no handler registered, permission policy) — fall back.
    }
  }

  return (await copyText(data.url)) ? 'copied' : 'failed';
}
