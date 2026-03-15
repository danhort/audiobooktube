import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("form/download", "routes/form.download.tsx"),
  route("settings", "routes/settings.tsx"),
] satisfies RouteConfig;
