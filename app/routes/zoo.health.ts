import { info } from "../lib/build";
import { health, json, preflight } from "../lib/zoo";
import type { Route } from "./+types/zoo.health";

// React Router sends GET, HEAD and OPTIONS to the loader: OPTIONS is the CORS preflight.
export const loader = ({ request }: Route.LoaderArgs) =>
  request.method === "OPTIONS" ? preflight(request) : json(request, 200, health(info));
