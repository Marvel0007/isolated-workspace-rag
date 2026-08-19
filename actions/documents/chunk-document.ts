"use server";

import { requireCurrentWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { chunkText } from "@/lib/documents/chunk-text";
import { extractText } from "@/lib/documents/extract-text";

export async function chunkDocument(documentId: string) {
  console.log("1. Starting document processing:", documentId);

  const workspace = await requireCurrentWorkspace();

  console.log("2. Workspace:", workspace.id);

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      workspaceId: workspace.id,
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  console.log("3. Document found:", document.fileName);
  console.log("4. File URL:", document.fileUrl);

  const response = await fetch(document.fileUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch document: ${response.status}`
    );
  }

  const blob = await response.blob();

  console.log("5. Blob fetched:", blob.size, blob.type);

  const file = new File(
    [blob],
    document.fileName,
    {
      type: document.fileType ?? blob.type,
    }
  );

  console.log("6. Extracting text...");

  const text = await extractText(file);

  console.log("7. Text length:", text.length);

  if (!text.trim()) {
    throw new Error("No text could be extracted from document");
  }

  console.log("8. Creating chunks...");

  const chunks = chunkText(text);

  console.log("9. Chunk count:", chunks.length);

  if (chunks.length === 0) {
    throw new Error("Chunking produced zero chunks");
  }

  await prisma.chunk.deleteMany({
    where: {
      documentId: document.id,
    },
  });

  console.log("10. Old chunks deleted");

  const result = await prisma.chunk.createMany({
    data: chunks.map((content, index) => ({
      content,
      chunkIndex: index,
      documentId: document.id,
    })),
  });

  console.log("11. Chunks created:", result.count);

  return {
    documentId: document.id,
    chunkCount: result.count,
  };
}