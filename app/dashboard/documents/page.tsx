import { FileText, Upload } from "lucide-react";
import { DocumentCard } from "@/components/documents/document-card";
import { getDocuments } from "@/actions/documents";
import { Button } from "@/components/ui/button";
import { UploadBox } from "@/components/documents/upload-box";

export default async function DocumentsPage() {
  const documents = await getDocuments();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Documents
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Upload and manage your knowledge base.
          </p>
        </div>

        <Button className="w-full sm:w-auto">
          <Upload className="mr-2 h-4 w-4" />
          Upload document
        </Button>
      </div>

      <UploadBox />

      {documents.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>

          <h2 className="mt-5 text-lg font-semibold">No documents yet</h2>

          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Upload your first document to start building your AI-powered
            knowledge base.
          </p>

          <Button className="mt-6">
            <Upload className="mr-2 h-4 w-4" />
            Upload your first document
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {documents.map((document) => (
            <DocumentCard
              key={document.id}
              id={document.id}
              title={document.title}
              fileName={document.fileName}
              status={document.status}
            />
          ))}
        </div>
      )}
    </div>
  );
}
