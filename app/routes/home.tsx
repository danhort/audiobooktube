import type { Route } from "./+types/home";
import { DownloadForm } from "./form.download";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Audiotube" }, { name: "description", content: "Download audio from youtube" }];
}

export default function Home() {
  return (
    <div className="container">
      <DownloadForm />
    </div>
  );
}
