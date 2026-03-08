import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/download.tsx"),
  route("settings", "routes/settings.tsx"),
] satisfies RouteConfig;
