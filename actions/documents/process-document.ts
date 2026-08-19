"use server";

import { requireCurrentWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { extractText } from "@/lib/documents/extract-text";

export async function processDocument(
  documentId: string
) {
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
      throw new Error("Failed to fetch document");
    }

    const blob = await response.blob();

    const file = new File(
      [blob],
      document.fileName,
      {
        type: document.fileType ?? undefined,
      }
    );

    const text = await extractText(file);

    if (!text.trim()) {
      throw new Error("No text could be extracted");
    }

    await prisma.document.update({
      where: {
        id: document.id,
      },
      data: {
        status: "COMPLETED",
      },
    });

    return {
      documentId: document.id,
      text,
    };
  } catch (error) {
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