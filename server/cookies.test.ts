import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { getSessionCookieOptions, isSecureRequest } from "./_core/cookies";

const request = (protocol: "http" | "https", forwardedProto?: string) =>
  ({
    protocol,
    headers: forwardedProto ? { "x-forwarded-proto": forwardedProto } : {},
  }) as Request;

describe("session cookie transport policy", () => {
  it("keeps SameSite=None and Secure for direct or proxied HTTPS", () => {
    expect(isSecureRequest(request("https"))).toBe(true);
    expect(getSessionCookieOptions(request("http", "https"))).toMatchObject({
      sameSite: "none",
      secure: true,
    });
  });

  it("uses Lax without Secure for the local HTTP OAuth callback", () => {
    expect(isSecureRequest(request("http"))).toBe(false);
    expect(getSessionCookieOptions(request("http"))).toMatchObject({
      sameSite: "lax",
      secure: false,
    });
  });
});
