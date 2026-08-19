const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 150;

export function chunkText(text: string): string[] {
  const cleanedText = text
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanedText) {
    return [];
  }

  const chunks: string[] = [];

  let start = 0;

  while (start < cleanedText.length) {
    const end = Math.min(
      start + CHUNK_SIZE,
      cleanedText.length
    );

    const chunk = cleanedText
      .slice(start, end)
      .trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= cleanedText.length) {
      break;
    }

    start = end - CHUNK_OVERLAP;
  }

  return chunks;
}