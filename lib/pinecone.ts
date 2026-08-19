import "server-only";

import { Pinecone } from "@pinecone-database/pinecone";

const apiKey = process.env.PINECONE_API_KEY;

if (!apiKey) {
  throw new Error("Missing PINECONE_API_KEY");
}

const pinecone = new Pinecone({
  apiKey,
});

export const pineconeIndex = pinecone.index(
  process.env.PINECONE_INDEX || "braindock"
);