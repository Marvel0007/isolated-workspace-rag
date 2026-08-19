import { RerankedChunk } from "@/lib/rag/reranking/types";
import { estimateTokenCount } from "@/lib/rag/ingestion/cleaner";

export interface GroundedSourceCitation {
  citationIndex: number;
  chunkId: string;
  documentId: string;
  documentTitle: string;
  fileName: string;
  pageNumber: number;
  sectionTitle?: string;
  relevanceScore: number;
  snippet: string;
  fullContent: string;
}

export interface BuiltContext {
  formattedContext: string;
  totalContextTokens: number;
  sources: GroundedSourceCitation[];
}

export interface ContextBuilderOptions {
  maxTokens?: number;       // Default: 4,000 tokens context budget
  useParentContext?: boolean; // Default: true (use parentContent if available)
}

/**
 * Builds a structured, deduplicated, token-budgeted prompt context block
 * with explicit citation metadata for strict LLM grounding.
 */
export function buildGroundedContext(
  chunks: RerankedChunk[],
  options: ContextBuilderOptions = {}
): BuiltContext {
  const maxTokens = options.maxTokens ?? 4000;
  const useParent = options.useParentContext ?? true;

  if (chunks.length === 0) {
    return {
      formattedContext: "",
      totalContextTokens: 0,
      sources: [],
    };
  }

  const sources: GroundedSourceCitation[] = [];
  const contextBlocks: string[] = [];
  const seenContent = new Set<string>();

  let accumulatedTokens = 0;
  let citationIndex = 1;

  for (const chunk of chunks) {
    // Choose between rich parent content or granular child content
    const textToInclude = (useParent && chunk.parentContent && chunk.parentContent.trim().length > 0)
      ? chunk.parentContent
      : chunk.content;

    // Deduplicate overlapping parent blocks across adjacent child chunks
    const normalizedKey = `${chunk.documentId}-${chunk.pageNumber}-${textToInclude.slice(0, 100)}`;
    if (seenContent.has(normalizedKey)) {
      continue;
    }
    seenContent.add(normalizedKey);

    const chunkTokens = estimateTokenCount(textToInclude);

    // Stop if we exceed our context token budget
    if (accumulatedTokens + chunkTokens > maxTokens && contextBlocks.length > 0) {
      break;
    }

    const relevancePct = Math.round(chunk.rerankScore * 100);
    const headerInfo = chunk.sectionTitle ? ` | Section: "${chunk.sectionTitle}"` : "";

    const formattedBlock = `
=== SOURCE [${citationIndex}] ===
Document: "${chunk.documentTitle}" (${chunk.fileName})
Page: ${chunk.pageNumber}${headerInfo}
Relevance: ${relevancePct}%
CitationTag: [cite:${chunk.documentId}:${chunk.chunkId}:${citationIndex}]

${textToInclude.trim()}
===========================`.trim();

    contextBlocks.push(formattedBlock);
    accumulatedTokens += estimateTokenCount(formattedBlock);

    sources.push({
      citationIndex,
      chunkId: chunk.chunkId,
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      fileName: chunk.fileName,
      pageNumber: chunk.pageNumber,
      sectionTitle: chunk.sectionTitle,
      relevanceScore: chunk.rerankScore,
      snippet: chunk.content.slice(0, 250),
      fullContent: textToInclude,
    });

    citationIndex++;
  }

  const formattedContext = contextBlocks.join("\n\n");

  return {
    formattedContext,
    totalContextTokens: accumulatedTokens,
    sources,
  };
}
