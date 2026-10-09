// Signed cookie session. SESSION_SECRET is read at run time, never at build time,
// and there is no default: without it the session is off.
import { randomUUID } from "node:crypto";
import { createCookieSessionStorage, type SessionStorage } from "react-router";

let cached: { secret: string; secure: boolean; storage: SessionStorage } | null = null;

export function sessionStorage(secret = process.env.SESSION_SECRET, secure = (process.env.PUBLIC_URL ?? "").startsWith("https://")): SessionStorage | null {
  if (!secret) return null;
  if (cached?.secret !== secret || cached.secure !== secure) {
    const storage = createCookieSessionStorage({
      cookie: { name: "__visits", httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 30 * 86400, secrets: [secret] },
    });
    cached = { secret, secure, storage };
  }
  return cached.storage;
}

// roundTrip signs a session with a random value, reads it back from the cookie,
// and checks that a tampered cookie is rejected.
export async function roundTrip(storage: SessionStorage): Promise<string> {
  const value = randomUUID();
  const session = await storage.getSession();
  session.set("probe", value);
  const cookie = (await storage.commitSession(session)).split(";")[0];
  const back = await storage.getSession(cookie);
  if (back.get("probe") !== value) throw new Error("signed cookie did not read back");
  const eq = cookie.indexOf("=") + 1;
  const tampered = cookie.slice(0, eq) + (cookie[eq] === "e" ? "f" : "e") + cookie.slice(eq + 1);
  if ((await storage.getSession(tampered)).get("probe") !== undefined) throw new Error("tampered cookie was accepted");
  return `cookie of ${cookie.length} bytes signed, read back, tampered copy rejected`;
}
