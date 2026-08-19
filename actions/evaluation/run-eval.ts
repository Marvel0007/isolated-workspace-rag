"use server";

import { requireCurrentWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { executeRagPipeline } from "@/lib/rag/pipeline/rag-engine";
import { evaluateRagResponse } from "@/lib/rag/evaluation/rag-triad-evaluator";
import { revalidatePath } from "next/cache";

export interface RunEvaluationParams {
  question: string;
  documentId?: string;
  groundTruth?: string;
}

export async function runRagEvaluation({
  question,
  documentId,
  groundTruth,
}: RunEvaluationParams) {
  const workspace = await requireCurrentWorkspace();

  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) {
    throw new Error("Question cannot be empty");
  }

  const start = Date.now();

  // 1. Run the live RAG pipeline
  const ragResult = await executeRagPipeline({
    question: trimmedQuestion,
    workspaceId: workspace.id,
    documentIds: documentId ? [documentId] : undefined,
  });

  const latencyMs = Date.now() - start;

  // 2. Run the Triad Evaluator against the retrieved context and generated answer
  const evalScores = await evaluateRagResponse({
    question: trimmedQuestion,
    retrievedContext: ragResult.context.formattedContext,
    generatedAnswer: ragResult.answer,
    groundTruth,
  });

  // 3. Persist evaluation run into PostgreSQL
  const savedEval = await prisma.ragEvaluation.create({
    data: {
      workspaceId: workspace.id,
      documentId: documentId || null,
      question: trimmedQuestion,
      groundTruth: groundTruth || null,
      retrievedContext: ragResult.context.formattedContext.slice(0, 10000),
      generatedAnswer: ragResult.answer,
      faithfulnessScore: evalScores.faithfulnessScore,
      answerRelevanceScore: evalScores.answerRelevanceScore,
      contextPrecisionScore: evalScores.contextPrecisionScore,
      latencyMs,
      status: "COMPLETED",
      notes: evalScores.faithfulnessExplanation,
    },
  });

  revalidatePath("/dashboard/evaluation");
  revalidatePath("/dashboard");

  return {
    evaluation: savedEval,
    scores: evalScores,
    ragResult,
  };
}
