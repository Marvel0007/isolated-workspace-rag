import { FusedRetrievedChunk } from "@/lib/rag/retrieval/types";

export interface RerankedChunk extends FusedRetrievedChunk {
  rerankScore: number;       // Calibrated Cross-Encoder relevance score (0.0 to 1.0)
  rerankRank: number;        // Rank position after cross-encoder scoring (1-indexed)
}

export interface RerankOptions {
  topN?: number;             // Number of top chunks to return after reranking (default: 5)
  scoreThreshold?: number;   // Minimum relevance score (default: 0.20)
  model?: string;            // Default: "rerank-v3.5"
}
