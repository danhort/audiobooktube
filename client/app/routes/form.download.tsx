import { spawn } from "node:child_process";
import type { Route } from "../+types/root";
import { useState } from "react";
import { Input } from "~/components/form/Input";
import { Button } from "~/components/form/Button";
import { Textarea } from "~/components/form/Textarea";
import { Fieldset } from "~/components/form/Fieldset";
import { Label } from "~/components/form/Label";
import { useLoaderData } from "react-router";

export const loader = async () => {
  return {
    mediaDestination: import.meta.env.ABT_MEDIA_DESTINATION,
    serverUrl: import.meta.env.ABT_SERVER_URL,
  };
};

export function DownloadForm() {
  const { mediaDestination, serverUrl } = useLoaderData<typeof loader>();
  const [output, setOutput] = useState<{ line: string; type: "log" | "error" }[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const clientId = "client_" + Math.random().toString(36).substr(2, 9);
  let eventSource: EventSource | null = null;

  const [progress, setProgress] = useState({
    percent: 0,
    speed: "0 KB/s",
    eta: "0s",
  });

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsDownloading(true);
    setOutput([]);

    const formData = new FormData(e.currentTarget);
    console.log("Form Data:", Object.fromEntries(formData.entries()));

    eventSource = new EventSource(`${serverUrl}/stream/${clientId}`);

    eventSource.onmessage = function (event) {
      console.log("Received event:", event.data);
      const data = JSON.parse(event.data);

      if (data.status === "complete") {
        eventSource?.close();
        setIsDownloading(false);
      } else {
        setProgress({ percent: data.percent, speed: data.speed, eta: data.eta });
      }
    };

    fetch(`${serverUrl}/download/${clientId}`, {
      method: "POST",
      body: formData,
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Fieldset>
          <Label htmlFor="link" required>
            Link
          </Label>
          <Input
            name="links[]"
            type="text"
            placeholder="Link"
            required
            value="https://youtu.be/thHmc9GOYmY?si=d5bxP2wV5qO-pYmw"
          />
          <Label htmlFor="link" required>
            Link
          </Label>
          <Input
            name="links[]"
            type="text"
            placeholder="Link"
            required
            value="https://youtu.be/thHmc9GOYmY?si=d5bxP2wV5qO-pYmw"
          />
          <Label htmlFor="title" required>
            Title
          </Label>
          <Input name="title" type="text" placeholder="Title" required value="test" />
          <Label htmlFor="author" required>
            Author
          </Label>
          <Input name="author" type="text" placeholder="Author" required value="test" />
          <Label htmlFor="narrator" required>
            Narrator
          </Label>
          <Input name="narrator" type="text" placeholder="Narrator" required value="test" />
          <Label htmlFor="mediaDestination" required>
            Media Destination
          </Label>
          <Input
            name="mediaDestination"
            placeholder="Media Destination"
            required
            value={mediaDestination}
          />
          <Button type="submit" disabled={isDownloading} className="col-span-2 justify-self-start">
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
        </Fieldset>
      </form>
      <div>
        <h2>Progress</h2>
        <p>{progress.percent}%</p>
        <p>Speed: {progress.speed}</p>
        <p>ETA: {progress.eta}</p>
      </div>
    </>
  );
}
