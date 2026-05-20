"use server";

import { revalidatePath } from "next/cache";
import { triggerCollection } from "@/lib/api";

export async function collectAction() {
  try {
    await triggerCollection();
  } catch {
    // API offline — ignora e apenas revalida o cache
  }
  revalidatePath("/");
}
