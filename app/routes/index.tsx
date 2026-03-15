import { DownloadForm } from "./form.download";
import { loader } from "./form.download";

export { loader };

export default function Home() {
  return (
    <div className="container">
      <h1>Download</h1>
      <DownloadForm />
    </div>
  );
}
