"use server";

import { requireCurrentWorkspace } from "@/lib/workspace";
import { searchSimilarChunks } from "@/lib/ai/search";

export async function searchDocuments(query: string) {
  const workspace = await requireCurrentWorkspace();

  if (!query.trim()) {
    throw new Error("Search query is required");
  }

  const matches = await searchSimilarChunks(
    query,
    workspace.id,
    5
  );

  return matches.map((match) => ({
    id: match.id,
    score: match.score,
    metadata: match.metadata,
  }));
}