"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { upsertEmbedding } from "@/lib/ai/upsert-embedding";

export async function embedDocument(documentId: string) {
  const workspace = await requireCurrentWorkspace();

  console.log("========== EMBEDDING DOCUMENT ==========");
  console.log("Document:", documentId);
  console.log("Workspace:", workspace.id);

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      workspaceId: workspace.id,
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  const chunks = await prisma.chunk.findMany({
    where: {
      documentId: document.id,
    },
    orderBy: {
      chunkIndex: "asc",
    },
  });

  console.log("Chunks found:", chunks.length);

  if (chunks.length === 0) {
    throw new Error("No chunks found for this document");
  }

  let processed = 0;

  for (const chunk of chunks) {
    console.log(
      `Processing chunk ${processed + 1}/${chunks.length}`
    );

    const embedding = await generateEmbedding(
      chunk.content
    );

    console.log(
      "Embedding dimensions:",
      embedding.length
    );

    if (embedding.length !== 1024) {
      throw new Error(
        `Expected 1024 dimensions, got ${embedding.length}`
      );
    }

    await upsertEmbedding({
      chunkId: chunk.id,
      documentId: document.id,
      workspaceId: workspace.id,
      embedding,
    });

    processed++;

    console.log(
      `✅ Upserted ${processed}/${chunks.length}`
    );
  }

  console.log("========== EMBEDDING COMPLETE ==========");

  return {
    documentId,
    chunksProcessed: processed,
  };
}