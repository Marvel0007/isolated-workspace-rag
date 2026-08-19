"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace";

export async function getSource(chunkId: string) {
  const workspace = await requireCurrentWorkspace();

  const chunk = await prisma.chunk.findFirst({
    where: {
      id: chunkId,
      document: {
        workspaceId: workspace.id,
      },
    },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          fileName: true,
          fileUrl: true,
          fileType: true,
          createdAt: true,
        },
      },
    },
  });

  if (!chunk) {
    throw new Error("Source chunk not found");
  }

  return {
    id: chunk.id,
    content: chunk.content,
    parentContent: chunk.parentContent ?? chunk.content,
    chunkIndex: chunk.chunkIndex,
    pageNumber: chunk.pageNumber ?? 1,
    sectionTitle: chunk.sectionTitle,
    tokenCount: chunk.tokenCount,
    document: chunk.document,
  };
}