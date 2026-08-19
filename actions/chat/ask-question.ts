"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace";
import { searchSimilarChunks } from "@/lib/ai/search";
import { generateAnswer } from "@/lib/ai/generate-answer";

export async function askQuestion(question: string) {
  const workspace = await requireCurrentWorkspace();

  const trimmedQuestion = question.trim();

  if (!trimmedQuestion) {
    throw new Error("Question cannot be empty");
  }

  console.log("=================================");
  console.log("BrainDock RAG");
  console.log("Question:", trimmedQuestion);
  console.log("Workspace ID:", workspace.id);
  console.log("=================================");

  // -----------------------------------------
  // 1. Search Pinecone
  // -----------------------------------------

  const matches = await searchSimilarChunks(
    trimmedQuestion,
    workspace.id,
    5
  );

  console.log(
    "Pinecone matches:",
    matches.length
  );

  console.log(
    "Pinecone matches:",
    matches.map((match) => ({
      id: match.id,
      score: match.score,
      metadata: match.metadata,
    }))
  );

  if (matches.length === 0) {
    console.log(
      "❌ Pinecone returned ZERO matches"
    );

    return {
      answer:
        "I couldn't find relevant information in your documents.",
      sources: [],
    };
  }

  // -----------------------------------------
  // 2. Get chunk IDs
  // -----------------------------------------

  const chunkIds = matches
    .map((match) => match.metadata?.chunkId)
    .filter(
      (id): id is string =>
        typeof id === "string"
    );

  if (chunkIds.length === 0) {
    console.log(
      "❌ No valid chunk IDs found in metadata"
    );

    return {
      answer:
        "I couldn't find relevant information in your documents.",
      sources: [],
    };
  }

  // -----------------------------------------
  // 3. Fetch chunks from PostgreSQL
  // -----------------------------------------

  const chunks = await prisma.chunk.findMany({
    where: {
      id: {
        in: chunkIds,
      },
      document: {
        workspaceId: workspace.id,
      },
    },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          fileName: true,
        },
      },
    },
  });

  console.log(
    "PostgreSQL chunks found:",
    chunks.length
  );

  if (chunks.length === 0) {
    console.log(
      "❌ Pinecone matched vectors but PostgreSQL returned ZERO chunks"
    );

    return {
      answer:
        "I couldn't find the source content for the matching documents.",
      sources: [],
    };
  }

  // -----------------------------------------
  // 4. Keep chunks in Pinecone ranking order
  // -----------------------------------------

  const chunkMap = new Map(
    chunks.map((chunk) => [
      chunk.id,
      chunk,
    ])
  );

  const orderedChunks = chunkIds
    .map((id) => chunkMap.get(id))
    .filter(
      (
        chunk
      ): chunk is (typeof chunks)[number] =>
        Boolean(chunk)
    );

  // -----------------------------------------
  // 5. Build context for Groq
  // -----------------------------------------

  const context = orderedChunks
    .map((chunk, index) => {
      return `
SOURCE ${index + 1}
Document: ${chunk.document.fileName}
Chunk: ${chunk.chunkIndex}

${chunk.content}
      `.trim();
    })
    .join("\n\n-------------------------\n\n");

  console.log(
    "Context length:",
    context.length
  );

  // -----------------------------------------
  // 6. Generate answer using Groq
  // -----------------------------------------

  console.log(
    "Sending context to Groq..."
  );

  const answer = await generateAnswer(
    trimmedQuestion,
    context
  );

  console.log(
    "✅ Groq answer generated"
  );

  // -----------------------------------------
  // 7. Build source citations
  // -----------------------------------------

  const sources = matches
    .map((match) => {
      const chunkId =
        match.metadata?.chunkId;

      const documentId =
        match.metadata?.documentId;

      if (
        typeof chunkId !== "string" ||
        typeof documentId !== "string"
      ) {
        return null;
      }

      const chunk = chunkMap.get(chunkId);

      if (!chunk) {
        return null;
      }

      return {
        chunkId,
        documentId,
        title: chunk.document.title,
        fileName: chunk.document.fileName,
        score: match.score ?? 0,
      };
    })
    .filter(
      (
        source
      ): source is NonNullable<typeof source> =>
        source !== null
    );

  console.log(
    "Sources:",
    sources
  );

  console.log(
    "================================="
  );
  console.log(
    "RAG COMPLETED"
  );
  console.log(
    "================================="
  );

  // -----------------------------------------
  // 8. Return answer + sources
  // -----------------------------------------

  return {
    answer,
    sources,
  };
}