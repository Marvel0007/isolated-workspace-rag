"use server";

import { requireCurrentWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { parseDocument } from "@/lib/rag/ingestion/parser";

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
    const response = await fetch(document.fileUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch document: HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    const parsed = await parseDocument(
      arrayBuffer,
      document.fileName,
      document.fileType ?? undefined
    );

    if (!parsed.fullText.trim()) {
      throw new Error("No readable text could be extracted from document");
    }

    await prisma.document.update({
      where: {
        id: document.id,
      },
      data: {
        status: "COMPLETED",
        tokenCount: parsed.totalTokens,
      },
    });

    return {
      documentId: document.id,
      sectionsCount: parsed.sections.length,
      totalTokens: parsed.totalTokens,
      text: parsed.fullText,
    };
  } catch (error) {
    console.error(`[Process Document Error] ID: ${documentId}`, error);

    await prisma.document.update({
      where: {
        id: document.id,
      },
      data: {
        status: "FAILED",
      },
    });

    throw error;
  }
}