import "server-only";

import { pineconeIndex } from "@/lib/pinecone";
import { CohereClientV2 } from "cohere-ai";

const cohere = new CohereClientV2({
  token: process.env.COHERE_API_KEY!,
});

export async function searchSimilarChunks(
  query: string,
  workspaceId: string,
  topK = 5
) {
  const response = await cohere.embed({
    model: "embed-english-v3.0",
    texts: [query],
    inputType: "search_query",
    embeddingTypes: ["float"],
  });

  const embedding = response.embeddings?.float?.[0];

  if (!embedding) {
    throw new Error("Failed to generate query embedding");
  }

  if (embedding.length !== 1024) {
    throw new Error(
      `Expected 1024 dimensions, got ${embedding.length}`
    );
  }

  const result = await pineconeIndex.query({
    vector: embedding,
    topK,
    includeMetadata: true,
    filter: {
      workspaceId: {
        $eq: workspaceId,
      },
    },
  });

  return result.matches;
}