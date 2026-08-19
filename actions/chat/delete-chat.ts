"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace";

export async function deleteChat(chatId: string) {
  const workspace = await requireCurrentWorkspace();

  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      workspaceId: workspace.id,
    },
  });

  if (!chat) {
    throw new Error("Chat not found");
  }

  await prisma.chat.delete({
    where: {
      id: chat.id,
    },
  });

  return {
    success: true,
  };
}