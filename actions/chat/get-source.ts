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
        },
      },
    },
  });

  if (!chunk) {
    throw new Error("Source not found");
  }

  return {
    id: chunk.id,
    content: chunk.content,
    chunkIndex: chunk.chunkIndex,
    document: chunk.document,
  };
}