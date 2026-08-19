import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Layers,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { getDocument } from "@/actions/documents/get-document";
import { Badge } from "@/components/ui/badge";
import { ProcessDocumentButton } from "@/components/documents/process-document-button";
import { DocumentInsightsTab } from "@/components/documents/document-insights-tab";
import { DocumentChunksTab } from "@/components/documents/document-chunks-tab";

interface DocumentDetailPageProps {
  params: Promise<{
    documentId: string;
  }>;
}

export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  const { documentId } = await params;

  let document;
  try {
    document = await getDocument(documentId);
  } catch {
    notFound();
  }

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 animate-in fade-in duration-300">
      {/* Top Breadcrumb / Back Link */}
      <div>
        <Link
          href="/dashboard/documents"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Documents</span>
        </Link>
      </div>

      {/* Document Header Card */}
      <div className="flex flex-col gap-6 rounded-2xl border bg-card/70 p-6 backdrop-blur-xs shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileText className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl text-foreground">
                {document.title}
              </h1>

              {document.status === "COMPLETED" && (
                <Badge variant="secondary" className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-600 text-xs">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>RAG Indexed</span>
                </Badge>
              )}

              {document.status === "PROCESSING" && (
                <Badge variant="secondary" className="gap-1 border-amber-500/20 bg-amber-500/10 text-amber-600 text-xs">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Indexing Vectors...</span>
                </Badge>
              )}

              {document.status === "FAILED" && (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Failed</span>
                </Badge>
              )}
            </div>

            <p className="mt-1 text-xs text-muted-foreground truncate max-w-md">
              {document.fileName}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {document.tokenCount && (
                <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
                  <Layers className="h-3 w-3 text-primary" />
                  <span>{document.tokenCount.toLocaleString()} Total Tokens</span>
                </Badge>
              )}

              {formatSize(document.fileSize) && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  {formatSize(document.fileSize)}
                </Badge>
              )}

              <Badge variant="outline" className="text-xs text-muted-foreground">
                {document.chunks.length} Chunks
              </Badge>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
          {document.fileUrl && (
            <a
              href={document.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <span>Original File</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          <div className="w-full sm:w-auto">
            <ProcessDocumentButton documentId={document.id} />
          </div>
        </div>
      </div>

      {/* Main Content Grid: AI Insights & Vector Chunks */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: AI Insights & Study Tools (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-2xl border bg-card/60 p-6 backdrop-blur-xs">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold tracking-tight">
                AI Knowledge Insights & Study Suite
              </h2>
            </div>

            <DocumentInsightsTab documentId={document.id} />
          </div>
        </div>

        {/* Right Column: Chunk Hierarchy & Vector Inspection (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-2xl border bg-card/60 p-6 backdrop-blur-xs">
            <div className="flex items-center gap-2 mb-6">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold tracking-tight">
                Indexed RAG Vectors
              </h2>
            </div>

            <DocumentChunksTab chunks={document.chunks} />
          </div>
        </div>
      </div>
    </div>
  );
}
