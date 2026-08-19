import "server-only";

import { pineconeIndex } from "@/lib/pinecone";

type UpsertEmbeddingParams = {
  chunkId: string;
  documentId: string;
  workspaceId: string;
  embedding: number[];
};

export async function upsertEmbedding({
  chunkId,
  documentId,
  workspaceId,
  embedding,
}: UpsertEmbeddingParams) {
  console.log("Upserting vector:", chunkId);

  await pineconeIndex.upsert({
    records: [
      {
        id: chunkId,
        values: embedding,
        metadata: {
          chunkId,
          documentId,
          workspaceId,
        },
      },
    ],
  });

  console.log("✅ Vector upserted:", chunkId);
}