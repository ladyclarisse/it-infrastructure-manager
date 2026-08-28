import {
  COOKIE_NAME,
  LOCAL_OAUTH_STATE_COOKIE,
  ONE_YEAR_MS,
  OAUTH_STATE_COOKIE,
  decodeOAuthState,
} from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions, isSecureRequest } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function summarizeOAuthCallbackError(error: unknown) {
  if (error instanceof Error) {
    const candidate = error as Error & { code?: unknown; status?: unknown; response?: { status?: unknown } };
    return {
      name: candidate.name || "Error",
      code: typeof candidate.code === "string" ? candidate.code : undefined,
      status: typeof candidate.response?.status === "number"
        ? candidate.response.status
        : typeof candidate.status === "number"
          ? candidate.status
          : undefined,
    };
  }
  return { name: "UnknownOAuthCallbackError" };
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login. An attacker can
    // forge `state`, but cannot plant this cookie in the victim's browser.
    const { nonce } = decodeOAuthState(state);
    const secureCallback = isSecureRequest(req);
    const stateCookieName = secureCallback ? OAUTH_STATE_COOKIE : LOCAL_OAUTH_STATE_COOKIE;
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[stateCookieName];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(stateCookieName, {
      path: "/",
      secure: secureCallback,
      sameSite: secureCallback ? "none" : "lax",
    });

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", summarizeOAuthCallbackError(error));
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
