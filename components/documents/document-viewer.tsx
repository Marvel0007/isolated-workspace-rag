"use client";

import { useEffect, useState } from "react";
import { getDocument } from "@/actions/documents/get-document";

type DocumentViewerProps = {
  documentId: string;
};

type DocumentData = {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: Date;
  updatedAt: Date;
};

export default function DocumentViewer({
  documentId,
}: DocumentViewerProps) {
  const [document, setDocument] =
    useState<DocumentData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDocument() {
      try {
        setLoading(true);
        setError("");

        const data = await getDocument(documentId);

        if (!cancelled) {
          setDocument(data);
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to load document.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDocument();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading document...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Document not found.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="shrink-0 border-b bg-background px-4 py-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">
              {document.title}
            </h1>

            <p className="truncate text-xs text-muted-foreground">
              {document.fileName}
            </p>
          </div>

          <span className="shrink-0 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
            {document.status}
          </span>
        </div>
      </div>

      {/* PDF */}
      <div className="min-h-0 flex-1 bg-muted/30">
        {document.fileUrl ? (
          <iframe
            src={document.fileUrl}
            title={document.title}
            className="h-full w-full border-0"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No document URL available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}