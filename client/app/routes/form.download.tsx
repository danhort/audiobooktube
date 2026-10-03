import { useId, useState } from "react";
import { Input } from "~/components/form/Input";
import { Button } from "~/components/form/Button";
import { Fieldset } from "~/components/form/Fieldset";
import { Label } from "~/components/form/Label";
import { Link, useLoaderData } from "react-router";
import { SortableList } from "~/components/SortableList";

export const loader = async () => {
  return {
    mediaDestination: import.meta.env.ABT_MEDIA_DESTINATION,
    serverUrl: `${import.meta.env.ABT_SERVER_URL}${import.meta.env.ABT_SERVER_PORT ? `:${import.meta.env.ABT_SERVER_PORT}` : ""}`,
  };
};

export function DownloadForm() {
  const { mediaDestination, serverUrl } = useLoaderData<typeof loader>();
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const id = useId();
  let eventSource: EventSource | null = null;
  const [eventQueue, setEvenQueue] = useState<{ status: string; message: string }[]>([]);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsDownloading(true);
    setEvenQueue([]);

    eventSource = new EventSource(`${serverUrl}/stream/${id}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      setEvenQueue((prev) => [
        ...prev,
        {
          status: data.status,
          message: data.message,
        },
      ]);

      if (data.status === "complete" || data.status === "error") {
        eventSource?.close();
        setIsDownloading(false);
      }
    };

    const formData = new FormData(e.currentTarget);
    links.forEach((link) => formData.append("links[]", link));

    fetch(`${serverUrl}/download/${id}`, {
      method: "POST",
      body: formData,
    })
      .then(async (response) => await response.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
      })
      .catch((error) => {
        console.error("Error:", error);
        setEvenQueue((prev) => [
          ...prev,
          {
            status: "error",
            message: error.message,
          },
        ]);
        setIsDownloading(false);
        eventSource?.close();
      });
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Fieldset>
          <Label htmlFor="links">Links</Label>
          <Input
            name="links"
            placeholder="Additional links"
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setLinks((prev) => [...prev, linkInput]);
                setLinkInput("");
              }
            }}
            value={linkInput}
            className="[&_input]:rounded-r-none"
          >
            <button
              type="button"
              className="
                flex items-center 
                cursor-pointer 
                h-full p-2 
                bg-green-600 hover:bg-green-700
                font-bold whitespace-nowrap
              "
              onClick={() => {
                setLinks((prev) => [...prev, linkInput]);
                setLinkInput("");
              }}
            >
              Add Link
            </button>
          </Input>
          <SortableList list={links} setList={setLinks} />
          <Label htmlFor="title">Title</Label>
          <Input name="title" type="text" placeholder="Title" />
          <Label htmlFor="author">Author</Label>
          <Input name="author" type="text" placeholder="Author" />
          <Label htmlFor="narrator">Narrator</Label>
          <Input name="narrator" type="text" placeholder="Narrator" />
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
      {eventQueue.length ? (
        <div className="py-2 px-3 mt-4 rounded-md bg-gray-800 h-[200px]">
          <div className="overflow-y-scroll h-full">
            {eventQueue.map(({ status, message }, index) => (
              <p
                key={index}
                className={`
              ${status === "error" ? "text-red-700" : ""}
              ${status === "downloading" ? "text-yellow-500" : ""}
              ${status === "finished" ? "text-green-500" : ""}
            `}
              >
                {message}
              </p>
            ))}
            <div ref={(el) => el?.scrollIntoView({ behavior: "smooth" })} />
          </div>
        </div>
      ) : null}
      <Link
        reloadDocument
        to={`/files/${id}`}
        download="audiobook.m4b"
        className="mt-4 inline-block text-blue-500 hover:underline"
      >
        Download File
      </Link>
    </>
  );
}
