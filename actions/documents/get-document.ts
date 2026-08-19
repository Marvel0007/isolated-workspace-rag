"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace";

export async function getDocument(documentId: string) {
  const workspace = await requireCurrentWorkspace();

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      workspaceId: workspace.id,
    },
    select: {
      id: true,
      title: true,
      fileName: true,
      fileUrl: true,
      fileType: true,
      fileSize: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  return document;
}