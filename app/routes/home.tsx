import type { Route } from "./+types/home";
import { DownloadForm } from "./download";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Audiobooktube" },
    { name: "description", content: "Download audio from youtube" },
  ];
}

export default function Home() {
  return (
    <div className="container">
      <DownloadForm />
    </div>
  );
}
