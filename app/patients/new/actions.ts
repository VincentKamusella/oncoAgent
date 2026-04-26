"use server";

import { createPatient } from "@/lib/data";
import type { CreatePatientInput } from "@/lib/onboarding/build-patient";

export async function createPatientAction(input: CreatePatientInput): Promise<string> {
  return createPatient(input);
}
