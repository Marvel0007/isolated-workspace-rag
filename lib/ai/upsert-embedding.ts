import "server-only";
import { batchUpsertPinecone } from "@/lib/rag/embeddings/pinecone-batch";

type UpsertEmbeddingParams = {
  chunkId: string;
  documentId: string;
  workspaceId: string;
  embedding: number[];
};

/**
 * Backward-compatible single upsert wrapper.
 */
export async function upsertEmbedding({
  chunkId,
  documentId,
  workspaceId,
  embedding,
}: UpsertEmbeddingParams) {
  await batchUpsertPinecone([
    {
      id: chunkId,
      values: embedding,
      metadata: {
        chunkId,
        documentId,
        workspaceId,
      },
    },
  ]);
}