import {
  FileText,
  MoreHorizontal,
} from "lucide-react";

import { ProcessDocumentButton } from "@/components/documents/process-document-button";
import { Button } from "@/components/ui/button";

type DocumentCardProps = {
  id: string;
  title: string;
  fileName: string;
  status: string;
};

export function DocumentCard({
  id,
  title,
  fileName,
  status,
}: DocumentCardProps) {
  return (
    <article className="group relative rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={`More options for ${title}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-5 min-w-0">
        <h2 className="truncate font-semibold">
          {title}
        </h2>

        <p className="mt-1 truncate text-sm text-muted-foreground">
          {fileName}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {status}
        </span>

        <span className="text-xs text-muted-foreground">
          Document
        </span>
      </div>
      <ProcessDocumentButton documentId={id} />
    </article>
  );
}