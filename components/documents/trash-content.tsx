"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrashDocumentCard } from "@/components/documents/trash-document-card";
import {
  restoreDocument,
  deleteDocumentPermanently,
  emptyTrash,
} from "@/actions/documents/manage-documents";

type TrashedDocument = {
  id: string;
  title: string;
  fileName: string;
  trashedAt: Date | null;
};

export function TrashContent({
  documents,
}: {
  documents: TrashedDocument[];
}) {
  const router = useRouter();
  const [isEmptying, startEmptying] = useTransition();

  async function handleRestore(id: string) {
    await restoreDocument(id);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await deleteDocumentPermanently(id);
    router.refresh();
  }

  function handleEmptyTrash() {
    startEmptying(async () => {
      await emptyTrash();
      router.refresh();
    });
  }

  if (documents.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Trash2 className="h-6 w-6 text-muted-foreground" />
        </div>

        <h2 className="mt-5 text-lg font-semibold">Trash is empty</h2>

        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Documents you delete will appear here. You can restore them or
          permanently remove them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warning banner */}
      <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
        <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
        <p className="text-sm text-muted-foreground">
          Trashed documents will remain here until you permanently delete them
          or restore them.
        </p>

        <Button
          variant="destructive"
          size="sm"
          className="ml-auto shrink-0"
          disabled={isEmptying}
          onClick={handleEmptyTrash}
        >
          Empty trash
        </Button>
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {documents.map((doc) => (
          <TrashDocumentCard
            key={doc.id}
            id={doc.id}
            title={doc.title}
            fileName={doc.fileName}
            trashedAt={doc.trashedAt ? doc.trashedAt.toISOString() : null}
            onRestore={handleRestore}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
