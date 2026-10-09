import { test } from "node:test";
import assert from "node:assert/strict";
import { roundTrip, sessionStorage } from "../app/lib/session.server.ts";

test("no SESSION_SECRET means no session, never a default", () => {
  assert.equal(sessionStorage(""), null);
  assert.equal(sessionStorage(undefined), null);
});

test("session round trip and tamper rejection", async () => {
  const storage = sessionStorage("test-secret-0123456789abcdef", true)!;
  assert.match(await roundTrip(storage), /read back, tampered copy rejected/);
  const s = await storage.getSession();
  s.set("visits", 3);
  const header = await storage.commitSession(s);
  assert.match(header, /HttpOnly/);
  assert.match(header, /Secure/);
  assert.match(header, /SameSite=Lax/);
  const other = sessionStorage("another-secret-0123456789", true)!;
  assert.equal((await other.getSession(header.split(";")[0])).get("visits"), undefined);
});
