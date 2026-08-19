import { extractText as extractPdfText } from "unpdf";

export async function extractText(file: File): Promise<string> {
  if (file.type === "text/plain") {
    const buffer = Buffer.from(await file.arrayBuffer());

    return buffer.toString("utf-8").trim();
  }

  if (file.type !== "application/pdf") {
    throw new Error("Unsupported file type");
  }

  const buffer = await file.arrayBuffer();

  const { text } = await extractPdfText(new Uint8Array(buffer));

  return text.join("\n\n").trim();
}