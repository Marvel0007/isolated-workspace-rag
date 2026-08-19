"use client";

import { useState } from "react";
import { Loader2, Play } from "lucide-react";

import { chunkDocument } from "@/actions/documents/chunk-document";
import { Button } from "@/components/ui/button";

type ProcessDocumentButtonProps = {
  documentId: string;
};

export function ProcessDocumentButton({
  documentId,
}: ProcessDocumentButtonProps) {
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  async function handleProcess() {
    try {
      setProcessing(true);
      setMessage("");

      const result = await chunkDocument(documentId);

      setMessage(`${result.chunkCount} chunks created.`);

      window.location.reload();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Processing failed."
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="mt-3">
      <Button
        size="sm"
        variant="outline"
        onClick={handleProcess}
        disabled={processing}
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Process
          </>
        )}
      </Button>

      {message && (
        <p className="mt-2 text-xs text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}