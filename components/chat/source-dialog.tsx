"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSource } from "@/actions/chat/get-source";

type SourceDialogProps = {
  chunkId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type SourceData = {
  id: string;
  content: string;
  chunkIndex: number;
  document: {
    id: string;
    title: string;
    fileName: string;
    fileUrl: string;
  };
};

export default function SourceDialog({
  chunkId,
  open,
  onOpenChange,
}: SourceDialogProps) {
  const [source, setSource] =
    useState<SourceData | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!open || chunkId === null) {
      return;
    }

    const selectedChunkId = chunkId;

    let cancelled = false;

    async function loadSource() {
      try {
        setLoading(true);
        setError("");

        const data = await getSource(
          selectedChunkId,
        );

        if (!cancelled) {
          setSource(data);
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to load source.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSource();

    return () => {
      cancelled = true;
    };
  }, [chunkId, open]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {source?.document.fileName ??
              "Source Details"}
          </DialogTitle>
        </DialogHeader>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-10">
            <p className="text-sm text-muted-foreground">
              Loading source...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Source */}
        {!loading && !error && source && (
          <div className="space-y-4">
            {/* Document information */}
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-sm font-semibold">
                {source.document.title}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {source.document.fileName}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                Chunk {source.chunkIndex + 1}
              </p>
            </div>

            {/* Chunk content */}
            <div>
              <p className="mb-2 text-sm font-semibold">
                Extracted Content
              </p>

              <div className="rounded-xl border bg-background p-4">
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {source.content}
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}