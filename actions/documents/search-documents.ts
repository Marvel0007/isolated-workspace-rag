"use server";

import { requireCurrentWorkspace } from "@/lib/workspace";
import { hybridRetrieve } from "@/lib/rag/retrieval/hybrid-retriever";
import { rerankChunks } from "@/lib/rag/reranking/cohere-reranker";

export async function searchDocuments(query: string) {
  const workspace = await requireCurrentWorkspace();
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  // 1. Hybrid dense + sparse retrieval
  const retrieved = await hybridRetrieve({
    query: trimmed,
    filter: { workspaceId: workspace.id },
    fusedTopK: 15,
  });

  if (retrieved.length === 0) {
    return [];
  }

  // 2. Cross-encoder rerank
  const reranked = await rerankChunks(trimmed, retrieved, {
    topN: 10,
    scoreThreshold: 0.05,
  });

  return reranked.map((item) => ({
    chunkId: item.chunkId,
    documentId: item.documentId,
    title: item.documentTitle,
    fileName: item.fileName,
    pageNumber: item.pageNumber,
    sectionTitle: item.sectionTitle,
    content: item.content,
    parentContent: item.parentContent,
    score: item.rerankScore,
    denseRank: item.denseRank,
    sparseRank: item.sparseRank,
  }));
}