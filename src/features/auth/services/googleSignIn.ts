/**
 * "Continue with Google", on SabiFlow's Google sign-in: nothing to set up with
 * Google. In SabiFlow, Customers → Settings → "Google sign-in on your own
 * website or app" must list this site's GOOGLE_CALLBACK_PATH exactly, e.g.
 * https://rewaciti.com/auth/google (and http://localhost:5173/auth/google
 * while building).
 *
 * The button sends this tab to SabiFlow with a PKCE challenge. Google brings
 * the customer back to /auth/google with the result after `#`, and that page
 * finishes with the verifier kept here, so a result only works in the browser
 * that started it. See the API docs, "Sign in with Google".
 */

const API_URL = import.meta.env.VITE_API_URL || "https://api.sabiflow.com/api";
const PENDING_KEY = "rewaciti_google_sign_in";

export const GOOGLE_CALLBACK_PATH = "/auth/google";

// Google refuses to sign in inside apps' built-in browsers (Instagram,
// Facebook, TikTok...), so the button isn't shown there. Email still works.
const IN_APP_BROWSER =
  /FBAN|FBAV|FB_IAB|Instagram|BytedanceWebview|musical_ly|TikTok|Snapchat|Twitter|LinkedInApp|Line\/|MicroMessenger|; wv\)/i;

export const canUseGoogleSignIn = () =>
  typeof navigator !== "undefined" && !IN_APP_BROWSER.test(navigator.userAgent);

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

// A page on this site only, never another one
const pageOnThisSite = (path: unknown) =>
  typeof path === "string" && path.startsWith("/") && !path.startsWith("//") ? path : "/";

/** Sends this tab to Google. `next` is where to go once signed in. */
export async function startGoogleSignIn(companyId: string, next = "/") {
  const codeVerifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  // S256 needs crypto.subtle (https and localhost). Elsewhere, such as a phone
  // trying the site over the local network, the verifier itself is sent.
  let codeChallenge = codeVerifier;
  let codeChallengeMethod = "plain";
  if (crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
    codeChallenge = base64url(new Uint8Array(digest));
    codeChallengeMethod = "S256";
  }

  sessionStorage.setItem(PENDING_KEY, JSON.stringify({ codeVerifier, next: pageOnThisSite(next) }));

  const params = new URLSearchParams({
    companyId,
    redirectUrl: `${window.location.origin}${GOOGLE_CALLBACK_PATH}`,
    codeChallenge,
    codeChallengeMethod,
  });
  window.location.assign(`${API_URL}/customers/google/start?${params.toString()}`);
}

export interface GoogleResult {
  handoff?: string;
  error?: string;
  cancelled?: boolean;
}

/** Google's result from the address, which is then removed so it never stays in the address bar or history. */
export function takeGoogleResult(): GoogleResult {
  const params = new URLSearchParams(window.location.hash.slice(1));
  window.history.replaceState(window.history.state, "", window.location.pathname);
  return {
    handoff: params.get("google_handoff") || undefined,
    error: params.get("google_error") || undefined,
    cancelled: params.has("google_cancelled"),
  };
}

/** The verifier and next page startGoogleSignIn kept, given out once. */
export function takePendingGoogleSignIn(): { codeVerifier: string; next: string } | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    const pending = raw ? JSON.parse(raw) : null;
    return typeof pending?.codeVerifier === "string" ? { codeVerifier: pending.codeVerifier, next: pageOnThisSite(pending.next) } : null;
  } catch {
    return null;
  }
}
