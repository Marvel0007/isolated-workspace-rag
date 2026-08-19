"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace";
import { executeRagPipeline } from "@/lib/rag/pipeline/rag-engine";

export async function sendMessage(chatId: string, content: string) {
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

  // 1. Save user message
  await prisma.message.create({
    data: {
      chatId: chat.id,
      role: "USER",
      content: message,
    },
  });

  // 2. Generate chat title from first user message
  if (!chat.title || chat.title === "New Chat") {
    const title = message.length > 45 ? `${message.slice(0, 45)}...` : message;
    await prisma.chat.update({
      where: { id: chat.id },
      data: { title },
    });
  }

  // 3. Execute Advanced RAG pipeline
  const ragResult = await executeRagPipeline({
    question: message,
    workspaceId: workspace.id,
  });

  const sources = ragResult.context.sources.map((src) => ({
    chunkId: src.chunkId,
    documentId: src.documentId,
    title: src.documentTitle,
    fileName: src.fileName,
    score: src.relevanceScore,
    pageNumber: src.pageNumber,
    sectionTitle: src.sectionTitle,
    snippet: src.snippet,
  }));

  // 4. Save assistant message
  const assistantMessage = await prisma.message.create({
    data: {
      chatId: chat.id,
      role: "ASSISTANT",
      content: ragResult.answer,
      sources: sources as unknown as object[],
    },
  });

  // 5. Save normalized citations
  if (ragResult.context.sources.length > 0) {
    await prisma.citation.createMany({
      data: ragResult.context.sources.map((src) => ({
        messageId: assistantMessage.id,
        documentId: src.documentId,
        chunkId: src.chunkId,
        snippet: src.snippet,
        pageNumber: src.pageNumber,
        similarity: src.relevanceScore,
        rerankScore: src.relevanceScore,
        citationIndex: src.citationIndex,
      })),
    });
  }

  // 6. Update chat timestamp
  await prisma.chat.update({
    where: { id: chat.id },
    data: { updatedAt: new Date() },
  });

  return {
    message: assistantMessage,
    sources,
    analysis: ragResult.analysis,
    latency: ragResult.latency,
  };
}