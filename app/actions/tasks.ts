"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { findTask } from "@/lib/tasks";
import { UPLOAD_DIR, removeCompletion, saveCompletion } from "@/lib/time-store";

export type CompleteState = { ok?: boolean; error?: string };

const MAX_PHOTOS = 6;
const MAX_BYTES = 5 * 1024 * 1024;

/** Identify the image by its first bytes rather than trusting the browser's type. */
function sniff(buf: Buffer): { ext: string; type: string } | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return { ext: "jpg", type: "image/jpeg" };
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { ext: "png", type: "image/png" };
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP")
    return { ext: "webp", type: "image/webp" };
  return null;
}

export async function completeTask(_prev: CompleteState, formData: FormData): Promise<CompleteState> {
  const user = await getCurrentUser();
  if (!user?.person) return { error: "Please sign in as a staff member." };

  const taskId = String(formData.get("taskId") ?? "");
  const task = findTask(user.person.id, taskId);
  if (!task) return { error: "That job isn't on your calendar." };
  if (new Date(task.start) > new Date()) return { error: "You can't complete a job that hasn't started yet." };
  if (task.completion) return { error: "This job is already marked complete." };

  const comment = String(formData.get("comment") ?? "").trim().slice(0, 1000);
  if (!comment) return { error: "Add a comment about the work done." };

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_PHOTOS) return { error: `Attach up to ${MAX_PHOTOS} photos.` };

  const photos: { id: string; contentType: string }[] = [];
  const written: string[] = [];
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    for (const file of files) {
      if (file.size > MAX_BYTES) throw new Error(`"${file.name}" is larger than 5 MB.`);
      const buf = Buffer.from(await file.arrayBuffer());
      const kind = sniff(buf);
      if (!kind) throw new Error(`"${file.name}" isn't a JPEG, PNG or WebP image.`);
      const id = `${randomUUID()}.${kind.ext}`;
      const dest = path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, id);
      await fs.writeFile(dest, buf);
      written.push(dest);
      photos.push({ id, contentType: kind.type });
    }
  } catch (err) {
    await Promise.all(written.map((f) => fs.rm(f, { force: true })));
    return { error: err instanceof Error ? err.message : "Couldn't save the photos." };
  }

  saveCompletion({
    taskId,
    personId: user.person.id,
    completedAt: new Date().toISOString(),
    comment,
    photos,
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function reopenTask(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.person) return;
  const taskId = String(formData.get("taskId") ?? "");
  if (!findTask(user.person.id, taskId)?.completion) return;
  const removed = removeCompletion(taskId);
  await Promise.all(
    (removed?.photos ?? []).map((p) => fs.rm(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, path.basename(p.id)), { force: true })),
  );
  revalidatePath("/", "layout");
}
