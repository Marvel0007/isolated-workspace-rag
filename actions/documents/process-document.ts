"use server";

import { requireCurrentWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { chunkDocument } from "./chunk-document";
import { embedDocument } from "./embed-document";

export async function processDocument(documentId: string) {
  const workspace = await requireCurrentWorkspace();

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      workspaceId: workspace.id,
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  try {
    await prisma.document.update({
      where: { id: document.id },
      data: { status: "PROCESSING" },
    });

    // 1. Structure-aware parsing and Parent-Child Chunking
    const chunkResult = await chunkDocument(documentId);

    // 2. Batch Embedding and Pinecone Indexing
    const embedResult = await embedDocument(documentId);

    await prisma.document.update({
      where: { id: document.id },
      data: { status: "COMPLETED" },
    });

    return {
      documentId,
      chunkCount: chunkResult.chunkCount,
      totalTokens: chunkResult.totalTokens,
      chunksProcessed: embedResult.chunksProcessed,
      status: "COMPLETED",
    };
  } catch (error) {
    console.error(`[Process Document Error] ID: ${documentId}`, error);

    await prisma.document.update({
      where: { id: document.id },
      data: { status: "FAILED" },
    });

    throw error;
  }
}