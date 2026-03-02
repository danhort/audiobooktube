import { spawn } from "node:child_process";
import type { Route } from "../+types/root";
import { useState } from "react";
import { Input } from "~/components/form/Input";
import { Button } from "~/components/form/Button";
import { Textarea } from "~/components/form/Textarea";

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const links = formData.get("links") as string;
  const title = formData.get("title") as string;
  const encoder = new TextEncoder();
  const uniqueId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const mediaLocation = process.env.VITE_MEDIA_LOCATION ?? "/Media/Audiobooks";

  const stream = new ReadableStream({
    start(controller) {
      const child = spawn("./bin/download.sh", [
        uniqueId,
        title,
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

export const DownloadForm = () => {
  const [output, setOutput] = useState<{ line: string; type: "log" | "error" }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setOutput([]);

    const formData = new FormData(e.currentTarget);
    const response = await fetch("/form/download", { method: "POST", body: formData });

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
      <form onSubmit={handleSubmit} className="grid grid-cols-[auto_1fr] gap-[20px]">
        <label htmlFor="link">Links</label>
        <Textarea
          name="links"
          rows={5}
          placeholder="Enter multiple Youtube links (one per line)"
          required
        />
        <label htmlFor="title">Title</label>
        <Input name="title" type="text" placeholder="Replacement title" required />
        <div className="col-span-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Downloading..." : "Download"}
          </Button>
        </div>
      </form>
      {output.length ? (
        <div className="p-[20px] border whitespace-pre-line mt-[20px]">
          {output.map((outputLine) => (
            <span className={outputLine.type === "error" ? "text-red-500" : ""}>
              {outputLine.line}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
};
