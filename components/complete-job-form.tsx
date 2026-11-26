"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Camera, CheckCircle2, ImagePlus, X } from "lucide-react";
import { completeTask } from "@/app/actions/tasks";

const MAX_PHOTOS = 6;
const MAX_EDGE = 1600;

type Picked = { key: string; file: File; url: string };

/** Downscale to a JPEG no larger than MAX_EDGE on its longest side. */
async function shrink(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file; // the server will reject anything that isn't a real image
  }
}

export function CompleteJobForm({ taskId }: { taskId: string }) {
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<Picked[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Free preview URLs when photos are removed or the form unmounts.
  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const room = MAX_PHOTOS - photos.length;
    const next = Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, room)
      .map((file) => {
        const url = URL.createObjectURL(file);
        urls.current.push(url);
        return { key: `${file.name}-${file.size}-${Math.random()}`, file, url };
      });
    if (list.length > room) setError(`You can attach up to ${MAX_PHOTOS} photos.`);
    setPhotos((p) => [...p, ...next]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!comment.trim()) {
      setError("Add a comment about the work done.");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("taskId", taskId);
      fd.set("comment", comment);
      for (const p of photos) fd.append("photos", await shrink(p.file));
      const result = await completeTask({}, fd);
      if (result.error) setError(result.error);
    });
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mark job complete</h3>

      <div>
        <label htmlFor={`comment-${taskId}`} className="sr-only">
          Comment
        </label>
        <textarea
          id={`comment-${taskId}`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="What was done, parts fitted, anything the customer should know"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div key={p.key} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`Selected photo ${p.file.name}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotos((all) => all.filter((x) => x.key !== p.key))}
                aria-label={`Remove ${p.file.name}`}
                className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-1 text-white hover:bg-slate-900"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 text-xs text-slate-500 hover:border-slate-400 hover:bg-slate-50"
            >
              {photos.length ? <ImagePlus className="h-5 w-5" aria-hidden /> : <Camera className="h-5 w-5" aria-hidden />}
              {photos.length ? "Add more" : "Add photos"}
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(e) => addFiles(e.target.files)}
          className="sr-only"
          aria-label="Add job photos"
          tabIndex={-1}
        />
        <p className="mt-1 text-xs text-slate-500">Up to {MAX_PHOTOS} photos. On a phone this opens the camera.</p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        <CheckCircle2 className="h-4 w-4" aria-hidden />
        {pending ? "Saving…" : "Mark job complete"}
      </button>
    </form>
  );
}
