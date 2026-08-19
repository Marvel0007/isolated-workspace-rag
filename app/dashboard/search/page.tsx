"use client";

import { useState, useTransition } from "react";
import { Search as SearchIcon, FileText, Loader2 } from "lucide-react";
import { searchDocuments } from "@/actions/documents/manage-documents";
import { DocumentCard } from "@/components/documents/document-card";

type SearchResult = {
  id: string;
  title: string;
  fileName: string;
  status: string;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (!query.trim()) return;

    startTransition(async () => {
      const docs = await searchDocuments(query);
      setResults(docs);
      setHasSearched(true);
    });
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Search
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find documents across your knowledge base.
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by document title or file name…"
            className="h-12 w-full rounded-xl border bg-card pl-12 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/20 focus:ring-2 focus:ring-ring/30"
          />
          {isPending && (
            <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </form>

      {/* Results */}
      {!hasSearched ? (
        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <SearchIcon className="h-6 w-6 text-muted-foreground" />
          </div>

          <h2 className="mt-5 text-lg font-semibold">
            Search your documents
          </h2>

          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Type a query above to search across all your document titles and
            file names.
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>

          <h2 className="mt-5 text-lg font-semibold">No results found</h2>

          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            No documents match &ldquo;{query}&rdquo;. Try a different search
            term.
          </p>
        </div>
      ) : (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            {results.length} result{results.length !== 1 ? "s" : ""} for
            &ldquo;{query}&rdquo;
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((doc) => (
              <DocumentCard
                key={doc.id}
                id={doc.id}
                title={doc.title}
                fileName={doc.fileName}
                status={doc.status}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
