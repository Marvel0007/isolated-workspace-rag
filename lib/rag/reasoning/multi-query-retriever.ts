import "server-only";
import { hybridRetrieve } from "@/lib/rag/retrieval/hybrid-retriever";
import { FusedRetrievedChunk, RetrievalFilter } from "@/lib/rag/retrieval/types";
import { analyzeAndRewriteQuery, AnalyzedQuery } from "./query-analyzer";

export interface MultiQueryRetrievalResult {
  analysis: AnalyzedQuery;
  chunks: FusedRetrievedChunk[];
  totalCandidatesEvaluated: number;
}

/**
 * Executes multi-query expansion and parallel hybrid retrieval across all query variations.
 * Fuses candidate lists using weighted Reciprocal Rank Fusion.
 */
export async function retrieveWithQueryExpansion(
  rawQuery: string,
  filter: RetrievalFilter,
  topK = 20
): Promise<MultiQueryRetrievalResult> {
  // 1. Analyze intent & expand query representations
  const analysis = await analyzeAndRewriteQuery(rawQuery);

  // Build the list of distinct search variations (including HyDE if present)
  const searchQueries = [...analysis.rewrittenQueries];
  if (analysis.hypotheticalPassage) {
    searchQueries.push(analysis.hypotheticalPassage);
  }

  // 2. Execute parallel hybrid retrieval for each query variation
  const retrievalPromises = searchQueries.map((q) =>
    hybridRetrieve({
      query: q,
      filter,
      denseTopK: 20,
      sparseTopK: 20,
      fusedTopK: 15,
    }).catch((err) => {
      console.error(`[Multi-Query Retrieval Error] Query: "${q}"`, err);
      return [] as FusedRetrievedChunk[];
    })
  );

  const queryResults = await Promise.all(retrievalPromises);

  // 3. Merge and consolidate all chunks across queries
  const chunkMap = new Map<string, FusedRetrievedChunk>();
  const scoreAccumulator = new Map<string, number>();

  queryResults.forEach((resultsForQuery) => {
    resultsForQuery.forEach((chunk, rank) => {
      chunkMap.set(chunk.chunkId, chunk);

      // Accumulate multi-query RRF score
      const currentScore = scoreAccumulator.get(chunk.chunkId) ?? 0;
      scoreAccumulator.set(chunk.chunkId, currentScore + 1 / (60 + rank + 1));
    });
  });

  // 4. Sort consolidated chunks by cumulative multi-query fusion score
  const consolidatedChunks = Array.from(chunkMap.values()).map((chunk) => {
    const combinedScore = scoreAccumulator.get(chunk.chunkId) ?? chunk.rrfScore;
    return {
      ...chunk,
      rrfScore: combinedScore,
    };
  });

  consolidatedChunks.sort((a, b) => b.rrfScore - a.rrfScore);

  const finalChunks = consolidatedChunks.slice(0, topK);

  return {
    analysis,
    chunks: finalChunks,
    totalCandidatesEvaluated: chunkMap.size,
  };
}
