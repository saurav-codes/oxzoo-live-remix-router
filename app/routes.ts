import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("_zoo/health", "routes/zoo.health.ts"),
  route("_zoo/probe", "routes/zoo.probe.ts"),
] satisfies RouteConfig;
