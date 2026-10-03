import type { Route } from "./+types/files";
import * as fs from "fs";
import * as path from "path";

export const loader = async ({ params }: Route.LoaderArgs) => {
  const mediaDestination = import.meta.env.ABT_MEDIA_DESTINATION;
  const fileDir = `${mediaDestination}/${params.id}`;
  const filePath = path.join(fileDir, "output.m4b");

  if (!fs.existsSync(filePath)) {
    throw new Response("File not found", { status: 404 });
  }

  const fileContent = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  return new Response(fileContent, {
    headers: {
      "Content-Type": "audio/x-m4b",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
};
