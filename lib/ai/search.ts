import "server-only";
import { denseSearch } from "@/lib/rag/retrieval/dense-retriever";

/**
 * Backward-compatible searchSimilarChunks wrapper.
 */
export async function searchSimilarChunks(
  query: string,
  workspaceId: string,
  topK = 5
) {
  const items = await denseSearch(query, { workspaceId }, topK);

  return items.map((item) => ({
    id: item.chunkId,
    score: item.score,
    metadata: {
      chunkId: item.chunkId,
      documentId: item.documentId,
      workspaceId,
    },
  }));
}