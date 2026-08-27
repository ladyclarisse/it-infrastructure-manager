import { eq } from "drizzle-orm";
import * as db from "../server/db";
import { sdk } from "../server/_core/sdk";
import { users } from "../drizzle/schema";

const probeOpenId = `sandbox-auth-probe-${Date.now()}`;

try {
  await db.upsertUser({
    openId: probeOpenId,
    name: "Sandbox OAuth Probe",
    email: null,
    loginMethod: "sandbox",
    role: "user",
    lastSignedIn: new Date(),
  });

  const user = await db.getUserByOpenId(probeOpenId);
  if (!user || user.role !== "user") {
    throw new Error("OAuth user upsert was not persisted with the default role");
  }

  const sessionToken = await sdk.createSessionToken(probeOpenId, {
    name: "Sandbox OAuth Probe",
  });
  const baseUrl = process.env.AUTH_TEST_BASE_URL;
  if (baseUrl) {
    const response = await fetch(`${baseUrl}/api/trpc/auth.me?batch=1&input=${encodeURIComponent('{"0":{"json":null}}')}`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    const payload = await response.json();
    const authenticatedOpenId = payload?.[0]?.result?.data?.json?.openId;
    if (!response.ok || authenticatedOpenId !== probeOpenId) {
      throw new Error("auth.me did not resolve the persisted session user");
    }
  }

  console.log(JSON.stringify({ status: "PASS", userPersisted: true, role: user.role, authMeVerified: Boolean(baseUrl) }));
} finally {
  const connection = await db.getDb();
  if (connection) {
    await connection.delete(users).where(eq(users.openId, probeOpenId));
  }
}
