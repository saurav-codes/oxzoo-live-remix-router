import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { BAKED_TAG, info } from "../lib/build";
import { roundTrip, sessionStorage } from "../lib/session.server";
import { env, preflight, probe, variable, type CheckSpec } from "../lib/zoo";
import type { Route } from "./+types/zoo.probe";

// clientHasTag reports whether a client bundle file contains the baked tag.
async function clientHasTag(tag: string): Promise<boolean> {
  const dir = join(process.cwd(), "build", "client", "assets");
  for (const f of await readdir(dir)) {
    if (f.endsWith(".js") && (await readFile(join(dir, f), "utf8")).includes(JSON.stringify(tag))) return true;
  }
  return false;
}

const checks: CheckSpec[] = [
  {
    id: "build-tag",
    label: "VITE_BUILD_TAG baked at build equals run time",
    env: ["VITE_BUILD_TAG"],
    async run() {
      if (!BAKED_TAG) throw new Error("VITE_BUILD_TAG was not set when the build ran: ox did not pass it to the build");
      const runtime = env("VITE_BUILD_TAG");
      if (runtime !== BAKED_TAG) throw new Error(`baked ${JSON.stringify(BAKED_TAG)} but run time is ${JSON.stringify(runtime)}: the build is stale`);
      if (!(await clientHasTag(BAKED_TAG))) throw new Error("the baked tag is missing from build/client/assets");
      return `ox passed VITE_BUILD_TAG to the build: ${BAKED_TAG} in the client bundle and at run time`;
    },
  },
  {
    id: "session",
    label: "Signed cookie session round trip",
    env: ["SESSION_SECRET"],
    async run() {
      return roundTrip(sessionStorage()!);
    },
  },
];

export const loader = ({ request }: Route.LoaderArgs) =>
  request.method === "OPTIONS" ? preflight(request) : probe(request, info, checks, [
    variable("SESSION_SECRET", "secret"),
    variable("VITE_BUILD_TAG", "plain", { show: true }),
    variable("ZOO_PANEL_ORIGIN", "plain", { show: true }),
  ]);
