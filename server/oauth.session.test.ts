import { describe, expect, it } from "vitest";
import { sdk } from "./_core/sdk";
import { summarizeOAuthCallbackError } from "./_core/oauth";

describe("OAuth session tokens", () => {
  it("uses the openId as a non-empty name fallback", async () => {
    const token = await sdk.createSessionToken("oauth-user-without-name", {
      name: "   ",
    });

    await expect(sdk.verifySession(token)).resolves.toMatchObject({
      openId: "oauth-user-without-name",
      name: "oauth-user-without-name",
    });
  });

  it("summarizes callback failures without retaining authorization data", () => {
    const failure = Object.assign(new Error("authorization code must remain private"), {
      code: "ECONNREFUSED",
      response: { status: 503 },
    });

    expect(summarizeOAuthCallbackError(failure)).toEqual({
      name: "Error",
      code: "ECONNREFUSED",
      status: 503,
    });
  });
});
