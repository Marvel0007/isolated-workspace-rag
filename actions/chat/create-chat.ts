"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace";

export async function createChat(title?: string) {
  const workspace = await requireCurrentWorkspace();

  const chat = await prisma.chat.create({
    data: {
      title: title?.trim() || "New Chat",
      workspaceId: workspace.id,
    },
  });

  return chat;
}