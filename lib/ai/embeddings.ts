import "server-only";

import { CohereClientV2 } from "cohere-ai";

const apiKey = process.env.COHERE_API_KEY;

if (!apiKey) {
  throw new Error("Missing COHERE_API_KEY");
}

const cohere = new CohereClientV2({
  token: apiKey,
});

export async function generateEmbedding(
  text: string
): Promise<number[]> {
  const response = await cohere.embed({
    model: "embed-english-v3.0",
    texts: [text],
    inputType: "search_document",
    embeddingTypes: ["float"],
  });

  const embedding = response.embeddings?.float?.[0];

  if (!embedding) {
    throw new Error("Failed to generate embedding");
  }

  return embedding;
}