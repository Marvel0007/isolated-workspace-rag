"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace";

export async function renameChat(
  chatId: string,
  title: string
) {
  const workspace = await requireCurrentWorkspace();

  const newTitle = title.trim();

  if (!newTitle) {
    throw new Error("Chat title cannot be empty");
  }

  if (newTitle.length > 100) {
    throw new Error(
      "Chat title cannot exceed 100 characters"
    );
  }

  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      workspaceId: workspace.id,
    },
  });

  if (!chat) {
    throw new Error("Chat not found");
  }

  const updatedChat = await prisma.chat.update({
    where: {
      id: chat.id,
    },
    data: {
      title: newTitle,
    },
  });

  return updatedChat;
}