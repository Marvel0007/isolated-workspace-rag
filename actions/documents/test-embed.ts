"use server";

import { embedDocument } from "@/actions/documents/embed-document";

export async function testEmbedDocument(
  documentId: string
) {
  return await embedDocument(documentId);
}