import { recursiveSplitText } from "@/lib/rag/chunking/recursive-chunker";

/**
 * Backward-compatible chunkText wrapper.
 * Delegates to the production-grade recursive structure chunker.
 */
export function chunkText(text: string): string[] {
  return recursiveSplitText(text, {
    chunkSize: 800,
    chunkOverlap: 150,
  });
}