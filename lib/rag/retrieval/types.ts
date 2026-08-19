export interface RetrievalFilter {
  workspaceId: string;
  documentIds?: string[];
  collectionId?: string;
}

export interface RawRetrievedItem {
  chunkId: string;
  documentId: string;
  score: number;
  rank: number;
  source: "dense" | "sparse";
}

export interface FusedRetrievedChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  fileName: string;
  pageNumber: number;
  sectionTitle?: string;
  content: string;
  parentContent?: string;
  tokenCount: number;
  denseRank?: number;
  sparseRank?: number;
  rrfScore: number;
  denseScore?: number;
}
