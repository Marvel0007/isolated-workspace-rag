import { Star, Sparkles } from "lucide-react";
import { getFavoriteDocuments } from "@/actions/documents/manage-documents";
import { DocumentCard } from "@/components/documents/document-card";

export default async function FavoritesPage() {
  const documents = await getFavoriteDocuments();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b pb-6">
        <div className="flex items-center gap-2 text-primary font-medium text-xs mb-1">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Curated Knowledge</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Starred & Favorite Documents
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quickly access your high-priority knowledge resources.
        </p>
      </div>

      {/* Content */}
      {documents.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center bg-muted/10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <Star className="h-7 w-7 fill-amber-500" />
          </div>

          <h2 className="mt-5 text-base font-semibold">No favorites yet</h2>

          <p className="mt-2 max-w-sm text-xs text-muted-foreground leading-relaxed">
            Click the star icon on any document card in the Documents page to pin it here for instant access.
          </p>
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
              fileSize={document.fileSize}
              tokenCount={document.tokenCount}
              isFavorite={true}
              fileType={document.fileType}
            />
          ))}
        </div>
      )}
    </div>
  );
}
