import { describe, expect, it } from "vitest";
import { sdk } from "./_core/sdk";

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
});
