import { RawRetrievedItem } from "./types";

export interface RRFCandidate {
  chunkId: string;
  documentId: string;
  rrfScore: number;
  denseRank?: number;
  sparseRank?: number;
  denseScore?: number;
  sparseScore?: number;
}

const DEFAULT_RRF_K = 60; // Standard IR smoothing constant

/**
 * Combines ranked lists from multiple retrievers using Reciprocal Rank Fusion (RRF).
 * 
 * Formula: RRF_Score(d) = SUM( 1 / (k + rank(d)) )
 */
export function reciprocalRankFusion(
  denseItems: RawRetrievedItem[],
  sparseItems: RawRetrievedItem[],
  k = DEFAULT_RRF_K
): RRFCandidate[] {
  const candidateMap = new Map<string, RRFCandidate>();

  // Process Dense Rankings
  denseItems.forEach((item) => {
    const rrfIncrement = 1 / (k + item.rank);

    const existing = candidateMap.get(item.chunkId);
    if (existing) {
      existing.rrfScore += rrfIncrement;
      existing.denseRank = item.rank;
      existing.denseScore = item.score;
    } else {
      candidateMap.set(item.chunkId, {
        chunkId: item.chunkId,
        documentId: item.documentId,
        rrfScore: rrfIncrement,
        denseRank: item.rank,
        denseScore: item.score,
      });
    }
  });

  // Process Sparse Rankings
  sparseItems.forEach((item) => {
    const rrfIncrement = 1 / (k + item.rank);

    const existing = candidateMap.get(item.chunkId);
    if (existing) {
      existing.rrfScore += rrfIncrement;
      existing.sparseRank = item.rank;
      existing.sparseScore = item.score;
    } else {
      candidateMap.set(item.chunkId, {
        chunkId: item.chunkId,
        documentId: item.documentId,
        rrfScore: rrfIncrement,
        sparseRank: item.rank,
        sparseScore: item.score,
      });
    }
  });

  // Sort all candidates descending by fused RRF score
  const sorted = Array.from(candidateMap.values()).sort(
    (a, b) => b.rrfScore - a.rrfScore
  );

  return sorted;
}
