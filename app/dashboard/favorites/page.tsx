import { Star } from "lucide-react";
import { getFavoriteDocuments } from "@/actions/documents/manage-documents";
import { DocumentCard } from "@/components/documents/document-card";

export default async function FavoritesPage() {
  const documents = await getFavoriteDocuments();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Favorites
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quickly access your most important documents.
        </p>
      </div>

      {/* Content */}
      {documents.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Star className="h-6 w-6 text-muted-foreground" />
          </div>

          <h2 className="mt-5 text-lg font-semibold">No favorites yet</h2>

          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Star your important documents to find them here. Use the star icon
            on any document card to add it to your favorites.
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
