import { spawn } from "node:child_process";
import type { Route } from "../+types/root";
import { useState } from "react";
import { Input } from "~/components/form/Input";
import { Button } from "~/components/form/Button";
import { Textarea } from "~/components/form/Textarea";
import { Fieldset } from "~/components/form/Fieldset";
import { Label } from "~/components/form/Label";
import { getSetting } from "~/model/database";
import { useLoaderData } from "react-router";

export const loader = async () => {
  return { mediaLocation: getSetting("mediaLocation") };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const links = formData.get("links") as string;
  const title = formData.get("title") as string;
  const author = formData.get("author") as string;
  const narrator = formData.get("narrator") as string;
  const mediaLocation = getSetting("mediaLocation") ?? "N/A";
  const encoder = new TextEncoder();
  const timestamp = Date.now();

  const stream = new ReadableStream({
    start(controller) {
      const child = spawn("./bin/download.sh", [
        timestamp.toString(),
        title,
        author,
        narrator,
        mediaLocation,
        ...links.split("\n").filter((link) => link.trim() !== ""),
      ]);

      child.stdout.on("data", (data: Buffer) => {
        const output = data.toString();
        console.log(output);
        controller.enqueue(encoder.encode(JSON.stringify({ type: "stdout", data: output }) + "\n"));
      });

      child.stderr.on("data", (data: Buffer) => {
        const output = data.toString();
        console.error(output);
        controller.enqueue(encoder.encode(JSON.stringify({ type: "stderr", data: output }) + "\n"));
      });

      child.on("close", () => {
        controller.close();
      });

      child.on("error", (err) => {
        console.error(err);

        controller.enqueue(
          encoder.encode(JSON.stringify({ type: "stderr", data: err.message }) + "\n")
        );
      });
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
};

export default function Download() {
  const { mediaLocation } = useLoaderData<typeof loader>();
  const [output, setOutput] = useState<{ line: string; type: "log" | "error" }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setOutput([]);

    const formData = new FormData(e.currentTarget);
    const response = await fetch("/download", { method: "POST", body: formData });

    if (!response.body) {
      setIsSubmitting(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line) continue;
          const { type, data } = JSON.parse(line) as { type: string; data: string };

          setOutput((prev) => [
            ...prev.filter(({ line }) => !line.includes("[download]")),
            { line: data, type: type === "stdout" ? "log" : "error" },
          ]);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h1>Download</h1>
      <form onSubmit={handleSubmit}>
        <Fieldset>
          <Label htmlFor="link" required>
            Links
          </Label>
          <Textarea
            name="links"
            rows={5}
            placeholder="Enter multiple video links (one per line)"
            required
          />
          <Label htmlFor="title" required>
            Title
          </Label>
          <Input name="title" type="text" placeholder="Title" required />
          <Label htmlFor="author" required>
            Author
          </Label>
          <Input name="author" type="text" placeholder="Author" required />
          <Label htmlFor="narrator" required>
            Narrator
          </Label>
          <Input name="narrator" type="text" placeholder="Narrator" required />
          <Label htmlFor="mediaLocation">Media Location</Label>
          <span>{mediaLocation ?? "N/A"}</span>
          <Button type="submit" disabled={isSubmitting} className="col-span-2 justify-self-start">
            {isSubmitting ? "Downloading..." : "Download"}
          </Button>
        </Fieldset>
      </form>
      {output.length ? (
        <div className="p-[20px] border whitespace-pre-line mt-[20px]">
          {output.map((outputLine) => (
            <span>{outputLine.line}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
