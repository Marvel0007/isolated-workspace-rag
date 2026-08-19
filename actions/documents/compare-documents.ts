"use server";

import { requireCurrentWorkspace } from "@/lib/workspace";
import { compareDocuments } from "@/lib/rag/reasoning/multi-doc-synthesizer";

export async function compareSelectedDocuments(
  documentIds: string[],
  topic?: string
) {
  const workspace = await requireCurrentWorkspace();

  if (!documentIds || documentIds.length < 2) {
    throw new Error("Please select at least two documents to compare.");
  }

  return compareDocuments({
    documentIds,
    workspaceId: workspace.id,
    comparisonTopic: topic,
  });
}
