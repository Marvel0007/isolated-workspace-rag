"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace";
import { generateBatchEmbeddings } from "@/lib/rag/embeddings/batch-embedder";
import { batchUpsertPinecone, VectorRecord } from "@/lib/rag/embeddings/pinecone-batch";

export async function embedDocument(documentId: string) {
  const workspace = await requireCurrentWorkspace();

  console.log(`[Batch Embedding] Starting for Document: ${documentId} (Workspace: ${workspace.id})`);

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

  if (chunks.length === 0) {
    throw new Error("No chunks found for this document to embed");
  }

  console.log(`[Batch Embedding] Found ${chunks.length} chunks. Generating embeddings...`);

  // 1. Generate embeddings in parallel batches (up to 96 per API call)
  const chunkTexts = chunks.map((c) => c.content);
  const embeddings = await generateBatchEmbeddings(chunkTexts, "search_document");

  if (embeddings.length !== chunks.length) {
    throw new Error(
      `Mismatch: ${chunks.length} chunks but received ${embeddings.length} embeddings`
    );
  }

  // 2. Prepare vector records with enriched metadata
  const vectorRecords: VectorRecord[] = chunks.map((chunk, idx) => ({
    id: chunk.id,
    values: embeddings[idx],
    metadata: {
      chunkId: chunk.id,
      documentId: document.id,
      workspaceId: workspace.id,
      pageNumber: chunk.pageNumber ?? 1,
      sectionTitle: chunk.sectionTitle ?? "",
      tokenCount: chunk.tokenCount ?? 0,
      snippet: chunk.content.slice(0, 300),
    },
  }));

  // 3. Batch upsert vectors into Pinecone (in batches of 100)
  console.log(`[Batch Embedding] Upserting ${vectorRecords.length} vectors to Pinecone...`);
  const upsertedCount = await batchUpsertPinecone(vectorRecords);

  // 4. Mark document status as COMPLETED
  await prisma.document.update({
    where: { id: document.id },
    data: { status: "COMPLETED" },
  });

  console.log(`[Batch Embedding Complete] Successfully embedded and indexed ${upsertedCount} chunks.`);

  return {
    documentId,
    chunksProcessed: upsertedCount,
  };
}