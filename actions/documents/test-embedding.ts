"use server";

import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/ai/embeddings";

export async function testEmbedding(documentId: string) {
  const chunk = await prisma.chunk.findFirst({
    where: {
      documentId,
    },
  });

  if (!chunk) {
    throw new Error("No chunks found");
  }

  const embedding = await generateEmbedding(chunk.content);

  console.log("Chunk ID:", chunk.id);
  console.log("Embedding dimensions:", embedding.length);
  console.log(
    "First 5 values:",
    embedding.slice(0, 5)
  );

  return {
    chunkId: chunk.id,
    dimensions: embedding.length,
  };
}