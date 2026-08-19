"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace";
import { askQuestion } from "@/actions/chat/ask-question";

export async function regenerateMessage(
  chatId: string,
  userMessageId: string,
) {
  const workspace = await requireCurrentWorkspace();

  // Verify the chat belongs to the current workspace
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      workspaceId: workspace.id,
    },
  });

  if (!chat) {
    throw new Error("Chat not found");
  }

  // Find the user message
  const userMessage = await prisma.message.findFirst({
    where: {
      id: userMessageId,
      chatId: chat.id,
      role: "USER",
    },
  });

  if (!userMessage) {
    throw new Error("User message not found");
  }

  // Run RAG again using the original question
  const result = await askQuestion(
    userMessage.content,
  );

  // Save the new assistant response
  const assistantMessage =
    await prisma.message.create({
      data: {
        chatId: chat.id,
        role: "ASSISTANT",
        content: result.answer,
        sources: result.sources,
      },
    });

  // Update chat timestamp
  await prisma.chat.update({
    where: {
      id: chat.id,
    },
    data: {
      updatedAt: new Date(),
    },
  });

  return {
    message: assistantMessage,
    sources: result.sources,
  };
}