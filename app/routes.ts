import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("form/download", "routes/form.download.tsx"),
] satisfies RouteConfig;
