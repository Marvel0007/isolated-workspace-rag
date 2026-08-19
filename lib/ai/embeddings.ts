import "server-only";
import { generateSingleEmbedding } from "@/lib/rag/embeddings/batch-embedder";

/**
 * Backward-compatible generateEmbedding wrapper.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  return generateSingleEmbedding(text, "search_document");
}