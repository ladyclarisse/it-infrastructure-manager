import { LOCAL_OAUTH_STATE_COOKIE, OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export function getOAuthStateCookieConfig(isSecureOrigin: boolean) {
  return {
    name: isSecureOrigin ? OAUTH_STATE_COOKIE : LOCAL_OAUTH_STATE_COOKIE,
    attributes: `Path=/; Max-Age=600; SameSite=${isSecureOrigin ? "None" : "Lax"}${
      isSecureOrigin ? "; Secure" : ""
    }`,
  };
}

// Start the Manus OAuth login. Call this from an event handler or effect at the
// moment you want to navigate, e.g. `onClick={() => startLogin()}`.
//
// It has SIDE EFFECTS — it mints a one-time nonce, writes the __Host- state
// cookie, and navigates immediately — so the cookie nonce always matches the
// `state` it sends. Do NOT call it during render (no `href={startLogin()}` /
// `loginUrl={...}`): each call overwrites the cookie, so a stray render-phase
// call would desync it from an in-flight login and the callback would reject it
// with "invalid oauth state". It returns false when local OAuth configuration is
// absent, otherwise it navigates immediately and returns true.
export const startLogin = (): boolean => {
  const oauthPortalUrl = (import.meta.env.VITE_OAUTH_PORTAL_URL || "https://oauth.manus.im").trim();
  const appId = (import.meta.env.VITE_APP_ID || "").trim();
  if (!appId) {
    console.warn("[OAuth] Login unavailable: VITE_APP_ID is not configured for this local build");
    return false;
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const stateCookie = getOAuthStateCookieConfig(window.location.protocol === "https:");

  const nonce = crypto.randomUUID();
  document.cookie = `${stateCookie.name}=${nonce}; ${stateCookie.attributes}`;
  const state = encodeOAuthState({ redirectUri, nonce });

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  window.location.href = url.toString();
  return true;
};
