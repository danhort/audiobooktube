import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  route("download", "routes/download.tsx"),
  route("settings", "routes/settings.tsx"),
] satisfies RouteConfig;
