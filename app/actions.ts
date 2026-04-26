"use server";

import { revalidatePath } from "next/cache";
import { deletePatient } from "@/lib/data";

export async function deletePatientAction(slug: string): Promise<void> {
  await deletePatient(slug);
  revalidatePath("/");
}
