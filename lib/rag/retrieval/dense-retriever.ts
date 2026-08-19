import "server-only";
import { pineconeIndex } from "@/lib/pinecone";
import { generateSingleEmbedding } from "@/lib/rag/embeddings/batch-embedder";
import { RawRetrievedItem, RetrievalFilter } from "./types";

/**
 * Executes dense vector similarity search against Pinecone index.
 */
export async function denseSearch(
  query: string,
  filter: RetrievalFilter,
  topK = 25
): Promise<RawRetrievedItem[]> {
  // 1. Generate query embedding (search_query input type)
  const queryVector = await generateSingleEmbedding(query, "search_query");

  // 2. Build Pinecone metadata filter with multi-tenant isolation
  const pineconeFilter: Record<string, unknown> = {
    workspaceId: { $eq: filter.workspaceId },
  };

  if (filter.documentIds && filter.documentIds.length > 0) {
    pineconeFilter.documentId = { $in: filter.documentIds };
  }

  // 3. Query vector database
  const result = await pineconeIndex.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
    filter: pineconeFilter,
  });

  const rawItems: RawRetrievedItem[] = [];

  result.matches.forEach((match, index) => {
    const chunkId = match.metadata?.chunkId as string | undefined;
    const documentId = match.metadata?.documentId as string | undefined;

    if (chunkId && documentId) {
      rawItems.push({
        chunkId,
        documentId,
        score: match.score ?? 0,
        rank: index + 1,
        source: "dense",
      });
    }
  });

  return rawItems;
}
