import "server-only";
import { pineconeIndex } from "@/lib/pinecone";

export interface VectorMetadata {
  chunkId: string;
  documentId: string;
  workspaceId: string;
  pageNumber?: number;
  sectionTitle?: string;
  tokenCount?: number;
  snippet?: string;
  [key: string]: unknown;
}

export interface VectorRecord {
  id: string;
  values: number[];
  metadata: VectorMetadata;
}

const PINECONE_BATCH_SIZE = 100;

/**
 * Batch upserts vectors and metadata into Pinecone.
 */
export async function batchUpsertPinecone(
  records: VectorRecord[]
): Promise<number> {
  if (records.length === 0) return 0;

  let totalUpserted = 0;

  for (let i = 0; i < records.length; i += PINECONE_BATCH_SIZE) {
    const batch = records.slice(i, i + PINECONE_BATCH_SIZE);

    await pineconeIndex.upsert({
      records: batch.map((r) => ({
        id: r.id,
        values: r.values,
        metadata: {
          chunkId: r.metadata.chunkId,
          documentId: r.metadata.documentId,
          workspaceId: r.metadata.workspaceId,
          pageNumber: r.metadata.pageNumber ?? 1,
          sectionTitle: r.metadata.sectionTitle ?? "",
          tokenCount: r.metadata.tokenCount ?? 0,
          snippet: r.metadata.snippet ? r.metadata.snippet.slice(0, 500) : "",
        },
      })),
    });

    totalUpserted += batch.length;
  }

  return totalUpserted;
}

/**
 * Deletes all vectors belonging to a specific document from Pinecone.
 */
export async function deleteDocumentVectors(
  documentId: string,
  workspaceId: string
): Promise<void> {
  try {
    await pineconeIndex.deleteMany({
      filter: {
        documentId: { $eq: documentId },
        workspaceId: { $eq: workspaceId },
      },
    });
  } catch (err) {
    console.error(`[Pinecone Delete Error] Doc: ${documentId}`, err);
  }
}
