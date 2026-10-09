import { data } from "react-router";
import { BAKED_TAG } from "../lib/build";
import { sessionStorage } from "../lib/session.server";
import type { Route } from "./+types/home";

export async function loader({ request }: Route.LoaderArgs) {
  const runtimeTag = process.env.VITE_BUILD_TAG ?? null;
  const storage = sessionStorage();
  if (!storage) return data({ runtimeTag, visits: null }, { headers: { "Cache-Control": "no-store" } });
  const session = await storage.getSession(request.headers.get("Cookie"));
  const visits = Math.min(Number(session.get("visits") ?? 0), 1e9) + 1;
  session.set("visits", visits);
  return data({ runtimeTag, visits }, { headers: { "Set-Cookie": await storage.commitSession(session), "Cache-Control": "no-store" } });
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { runtimeTag, visits } = loaderData;
  return (
    <main>
      <h1>Build time vs run time</h1>
      <p>
        Build tag baked into this bundle: <strong data-testid="baked">{BAKED_TAG || "(none: VITE_BUILD_TAG was unset at build)"}</strong>
      </p>
      <p>
        <code>VITE_BUILD_TAG</code> at run time on the server: <strong>{runtimeTag ?? "(unset)"}</strong>{" "}
        {runtimeTag === BAKED_TAG ? "matches" : "differs: redeploy to rebuild"}
      </p>
      <p>
        {visits === null
          ? "SESSION_SECRET is not set, so the signed session is off."
          : `Visits in this signed cookie session: ${visits}`}
      </p>
      <p>
        <a href="/_zoo/health">health</a> · <a href="/_zoo/probe">probe</a>
      </p>
    </main>
  );
}
