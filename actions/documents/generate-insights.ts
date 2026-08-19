"use server";

import { requireCurrentWorkspace } from "@/lib/workspace";
import {
  generateDocumentSummary,
  generateStudyNotes,
  generateFlashcardsAndQuiz,
} from "@/lib/rag/tools/document-insights";
import { revalidatePath } from "next/cache";

export async function summarizeDocument(documentId: string) {
  const workspace = await requireCurrentWorkspace();
  const summary = await generateDocumentSummary(documentId, workspace.id);
  revalidatePath("/dashboard");
  return summary;
}

export async function getDocumentStudyNotes(documentId: string) {
  const workspace = await requireCurrentWorkspace();
  return generateStudyNotes(documentId, workspace.id);
}

export async function getDocumentFlashcards(documentId: string) {
  const workspace = await requireCurrentWorkspace();
  return generateFlashcardsAndQuiz(documentId, workspace.id);
}
