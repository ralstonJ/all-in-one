"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { deleteSop, upsertSop } from "@/lib/sops";

export type SopFormState = { error?: string };

export async function saveSopAction(_prev: SopFormState, formData: FormData): Promise<SopFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in again." };

  const str = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max);
  const id = str("id", 100) || undefined;
  const title = str("title", 120);
  const summary = str("summary", 240);
  const body = str("body", 20000);
  const departments = [...new Set(formData.getAll("departments").map(String))];

  if (!title) return { error: "Give the SOP a title." };
  if (!body) return { error: "Write the procedure steps." };

  const result = upsertSop(user, { id, title, summary, body, departments });
  if (result.error || !result.sop) return { error: result.error ?? "Couldn't save the SOP." };

  revalidatePath("/docs");
  redirect(`/docs/${result.sop.id}`);
}

export async function deleteSopAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const { error } = deleteSop(user, String(formData.get("id") ?? ""));
  if (error) return;
  revalidatePath("/docs");
  redirect("/docs");
}
