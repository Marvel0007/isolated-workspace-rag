"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace";
import { askQuestion } from "@/actions/chat/ask-question";

export async function sendMessage(
  chatId: string,
  content: string
) {
  const workspace = await requireCurrentWorkspace();

  const message = content.trim();

  if (!message) {
    throw new Error("Message cannot be empty");
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

  // Save user message
  await prisma.message.create({
    data: {
      chatId: chat.id,
      role: "USER",
      content: message,
    },
  });

  // Generate chat title from first user message
  if (!chat.title || chat.title === "New Chat") {
    const title =
      message.length > 50
        ? `${message.slice(0, 50)}...`
        : message;

    await prisma.chat.update({
      where: {
        id: chat.id,
      },
      data: {
        title,
      },
    });
  }

  // Run RAG + Groq
  const result = await askQuestion(message);

  // Save assistant response
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