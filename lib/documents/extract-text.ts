import { parseDocument } from "@/lib/rag/ingestion/parser";

/**
 * Backward-compatible text extraction wrapper.
 * Delegates to the production-grade universal parser.
 */
export async function extractText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const parsed = await parseDocument(buffer, file.name, file.type);
  return parsed.fullText;
}