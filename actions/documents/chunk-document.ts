"use server";

import { requireCurrentWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { parseDocument } from "@/lib/rag/ingestion/parser";
import { buildParentChildChunks } from "@/lib/rag/chunking/parent-child-chunker";

export async function chunkDocument(documentId: string) {
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

  const response = await fetch(document.fileUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch document: HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  // 1. Structure-aware multi-format parsing
  const parsed = await parseDocument(
    arrayBuffer,
    document.fileName,
    document.fileType ?? undefined
  );

  if (parsed.sections.length === 0) {
    throw new Error("No extractable text found in document");
  }

  // 2. Build hierarchical Parent-Child chunks
  const hierarchicalChunks = buildParentChildChunks(parsed.sections, {
    parentChunkSize: 1800,
    parentOverlap: 250,
    childChunkSize: 500,
    childOverlap: 100,
  });

  if (hierarchicalChunks.length === 0) {
    throw new Error("Chunking produced zero chunks");
  }

  // 3. Clear existing chunks
  await prisma.chunk.deleteMany({
    where: {
      documentId: document.id,
    },
  });

  // 4. Batch insert enhanced chunks
  const created = await prisma.chunk.createMany({
    data: hierarchicalChunks.map((chunk) => ({
      content: chunk.content,
      parentContent: chunk.parentContent,
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber,
      sectionTitle: chunk.sectionTitle ?? null,
      tokenCount: chunk.tokenCount,
      documentId: document.id,
    })),
  });

  // 5. Update document total tokens
  await prisma.document.update({
    where: { id: document.id },
    data: { tokenCount: parsed.totalTokens },
  });

  return {
    documentId: document.id,
    chunkCount: created.count,
    totalTokens: parsed.totalTokens,
  };
}