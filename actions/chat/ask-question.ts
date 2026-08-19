"use server";

import { requireCurrentWorkspace } from "@/lib/workspace";
import { executeRagPipeline } from "@/lib/rag/pipeline/rag-engine";

export async function askQuestion(question: string) {
  const workspace = await requireCurrentWorkspace();

  const trimmedQuestion = question.trim();

  if (!trimmedQuestion) {
    throw new Error("Question cannot be empty");
  }

  const result = await executeRagPipeline({
    question: trimmedQuestion,
    workspaceId: workspace.id,
  });

  return {
    answer: result.answer,
    sources: result.context.sources.map((src) => ({
      chunkId: src.chunkId,
      documentId: src.documentId,
      title: src.documentTitle,
      fileName: src.fileName,
      score: src.relevanceScore,
      pageNumber: src.pageNumber,
      sectionTitle: src.sectionTitle,
      snippet: src.snippet,
    })),
    analysis: result.analysis,
    latency: result.latency,
  };
}