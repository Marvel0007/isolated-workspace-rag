import "server-only";
import { prisma } from "@/lib/prisma";
import { denseSearch } from "./dense-retriever";
import { sparseSearch } from "./sparse-retriever";
import { reciprocalRankFusion } from "./rrf-fusion";
import { FusedRetrievedChunk, RetrievalFilter } from "./types";

export interface HybridRetrievalOptions {
  query: string;
  filter: RetrievalFilter;
  denseTopK?: number;
  sparseTopK?: number;
  fusedTopK?: number;
}

/**
 * Main Hybrid Retrieval engine.
 * Executes parallel Dense (Pinecone) + Sparse (Postgres) search and fuses with RRF.
 */
export async function hybridRetrieve({
  query,
  filter,
  denseTopK = 25,
  sparseTopK = 25,
  fusedTopK = 20,
}: HybridRetrievalOptions): Promise<FusedRetrievedChunk[]> {
  const startTime = Date.now();

  // 1. Run Dense Vector and Sparse Keyword searches in parallel
  const [denseResults, sparseResults] = await Promise.all([
    denseSearch(query, filter, denseTopK).catch((err) => {
      console.error("[Dense Search Error]", err);
      return [];
    }),
    sparseSearch(query, filter, sparseTopK).catch((err) => {
      console.error("[Sparse Search Error]", err);
      return [];
    }),
  ]);

  // 2. Combine ranked candidate lists using Reciprocal Rank Fusion
  const fusedCandidates = reciprocalRankFusion(denseResults, sparseResults);
  const topCandidates = fusedCandidates.slice(0, fusedTopK);

  if (topCandidates.length === 0) {
    return [];
  }

  const chunkIds = topCandidates.map((c) => c.chunkId);

  // 3. Hydrate complete chunk and document records from PostgreSQL
  const dbChunks = await prisma.chunk.findMany({
    where: {
      id: { in: chunkIds },
      document: {
        workspaceId: filter.workspaceId,
        isTrashed: false,
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

  const chunkMap = new Map(dbChunks.map((c) => [c.id, c]));

  // 4. Construct final hydrated results in strict RRF score order
  const results: FusedRetrievedChunk[] = [];

  for (const candidate of topCandidates) {
    const chunk = chunkMap.get(candidate.chunkId);
    if (!chunk) continue;

    results.push({
      chunkId: chunk.id,
      documentId: chunk.document.id,
      documentTitle: chunk.document.title,
      fileName: chunk.document.fileName,
      pageNumber: chunk.pageNumber ?? 1,
      sectionTitle: chunk.sectionTitle ?? undefined,
      content: chunk.content,
      parentContent: chunk.parentContent ?? undefined,
      tokenCount: chunk.tokenCount ?? Math.ceil(chunk.content.length / 4),
      denseRank: candidate.denseRank,
      sparseRank: candidate.sparseRank,
      denseScore: candidate.denseScore,
      rrfScore: candidate.rrfScore,
    });
  }

  console.log(
    `[Hybrid Retrieval] Retrieved ${results.length} chunks (${denseResults.length} dense, ${sparseResults.length} sparse) in ${Date.now() - startTime}ms`
  );

  return results;
}
