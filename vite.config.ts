import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return defineConfig({
    envPrefix: "ABT_",
    server: {
      port: Number(env.PORT) || 3000,
    },
    plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  });
};
