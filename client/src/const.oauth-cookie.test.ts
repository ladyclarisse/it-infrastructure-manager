import { describe, expect, it } from "vitest";
import { getOAuthStateCookieConfig } from "./const";

describe("OAuth state cookie configuration", () => {
  it("uses a host-prefixed secure cookie on HTTPS origins", () => {
    expect(getOAuthStateCookieConfig(true)).toEqual({
      name: "__Host-oauth_state",
      attributes: "Path=/; Max-Age=600; SameSite=None; Secure",
    });
  });

  it("uses a host-only Lax cookie on HTTP localhost origins", () => {
    expect(getOAuthStateCookieConfig(false)).toEqual({
      name: "oauth_state",
      attributes: "Path=/; Max-Age=600; SameSite=Lax",
    });
  });
});
