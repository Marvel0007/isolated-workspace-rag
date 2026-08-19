"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace";

export async function getChats() {
  const workspace = await requireCurrentWorkspace();

  return prisma.chat.findMany({
    where: {
      workspaceId: workspace.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}