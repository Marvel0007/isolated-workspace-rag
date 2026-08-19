import { ParsedSection } from "@/lib/rag/ingestion/parser";
import { recursiveSplitText } from "./recursive-chunker";
import { estimateTokenCount } from "@/lib/rag/ingestion/cleaner";

export interface HierarchicalChunk {
  content: string;
  parentContent: string;
  chunkIndex: number;
  pageNumber: number;
  sectionTitle?: string;
  tokenCount: number;
}

export interface ChunkingConfig {
  parentChunkSize?: number;  // Default ~1800 chars (~450 tokens)
  parentOverlap?: number;    // Default ~250 chars (~60 tokens)
  childChunkSize?: number;   // Default ~500 chars (~125 tokens)
  childOverlap?: number;     // Default ~100 chars (~25 tokens)
}

/**
 * Creates hierarchical Parent-Child chunks across all parsed document sections.
 * 
 * - Child Chunks are smaller, granular units optimized for vector search embedding.
 * - Parent Chunks are surrounding broader context blocks passed to LLM during generation.
 */
export function buildParentChildChunks(
  sections: ParsedSection[],
  config: ChunkingConfig = {}
): HierarchicalChunk[] {
  const parentChunkSize = config.parentChunkSize ?? 1800;
  const parentOverlap = config.parentOverlap ?? 250;
  const childChunkSize = config.childChunkSize ?? 500;
  const childOverlap = config.childOverlap ?? 100;

  const hierarchicalChunks: HierarchicalChunk[] = [];
  let globalChunkIndex = 0;

  for (const section of sections) {
    const sectionText = section.content.trim();
    if (!sectionText) continue;

    // 1. Create Parent Context Blocks for this section
    const parentBlocks = recursiveSplitText(sectionText, {
      chunkSize: parentChunkSize,
      chunkOverlap: parentOverlap,
    });

    for (const parentBlock of parentBlocks) {
      // 2. Create Child Search Chunks from each Parent Block
      const childChunks = recursiveSplitText(parentBlock, {
        chunkSize: childChunkSize,
        chunkOverlap: childOverlap,
      });

      for (const childContent of childChunks) {
        hierarchicalChunks.push({
          content: childContent,
          parentContent: parentBlock,
          chunkIndex: globalChunkIndex++,
          pageNumber: section.pageNumber,
          sectionTitle: section.sectionTitle,
          tokenCount: estimateTokenCount(childContent),
        });
      }
    }
  }

  return hierarchicalChunks;
}
