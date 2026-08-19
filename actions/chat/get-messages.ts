"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace";

export async function getChatMessages(
  chatId: string
) {
  const workspace =
    await requireCurrentWorkspace();

  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      workspaceId: workspace.id,
    },
  });

  if (!chat) {
    throw new Error("Chat not found");
  }

  return prisma.message.findMany({
    where: {
      chatId: chat.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}