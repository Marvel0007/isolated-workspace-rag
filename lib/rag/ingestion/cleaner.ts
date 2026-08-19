/**
 * Text cleaner and normalizer for production-grade RAG ingestion.
 * Handles Unicode normalization, PDF artifact removal, hyphenation repairs,
 * and excess whitespace collapsing while preserving markdown structure.
 */

export function cleanExtractedText(rawText: string): string {
  if (!rawText) return "";

  let cleaned = rawText;

  // 1. Normalize Unicode (decompose & recompose canonical characters)
  cleaned = cleaned.normalize("NFKC");

  // 2. Replace common PDF ligatures & non-standard punctuation
  cleaned = cleaned
    .replace(/ﬁ/g, "fi")
    .replace(/ﬂ/g, "fl")
    .replace(/ﬀ/g, "ff")
    .replace(/ﬃ/g, "ffi")
    .replace(/ﬄ/g, "ffl")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00A0/g, " ") // Non-breaking space
    .replace(/\0/g, ""); // Null bytes

  // 3. Fix hyphenation split across line breaks (e.g., "infor-\nmation" -> "information")
  cleaned = cleaned.replace(/(\w+)-\s*\n\s*(\w+)/g, "$1$2");

  // 4. Normalize newlines
  cleaned = cleaned.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 5. Remove excessive blank lines (more than 2 consecutive newlines)
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  // 6. Normalize inline horizontal whitespace (tabs and multiple spaces)
  cleaned = cleaned
    .split("\n")
    .map((line) => line.replace(/[^\S\r\n]+/g, " ").trim())
    .join("\n");

  return cleaned.trim();
}

/**
 * Approximate token count using standard 1 token ≈ 4 characters rule
 * (accurate within ~10% for English text before tokenization).
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}
