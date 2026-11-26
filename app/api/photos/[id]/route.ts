import fs from "node:fs/promises";
import path from "node:path";
import { canSeeBusinessDashboards, getCurrentUser } from "@/lib/auth";
import { getManagementChain, getPerson } from "@/lib/org";
import { UPLOAD_DIR, findPhoto } from "@/lib/time-store";

/**
 * Serves a job-completion photo to: the person who took it, anyone in their
 * management chain, the owner and admins.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const id = path.basename((await params).id);
  const completion = findPhoto(id);
  const photo = completion?.photos.find((p) => p.id === id);
  if (!completion || !photo) return new Response("Not found", { status: 404 });

  const worker = getPerson(completion.personId);
  const allowed =
    canSeeBusinessDashboards(user) ||
    user.person?.id === completion.personId ||
    (!!worker && !!user.person && getManagementChain(worker).some((m) => m.id === user.person!.id));
  if (!allowed) return new Response("Forbidden", { status: 403 });

  try {
    const data = await fs.readFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, id));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": photo.contentType,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
