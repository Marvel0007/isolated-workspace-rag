"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Search as SearchIcon, FileText, Loader2, Sparkles, BookOpen, ExternalLink } from "lucide-react";
import { searchDocuments } from "@/actions/documents/search-documents";
import { Badge } from "@/components/ui/badge";
import { CitationDrawer } from "@/components/chat/citation-drawer";

type SearchResultItem = {
  chunkId: string;
  documentId: string;
  title: string;
  fileName: string;
  pageNumber?: number;
  sectionTitle?: string;
  content: string;
  parentContent?: string;
  score: number;
  denseRank?: number;
  sparseRank?: number;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    startTransition(async () => {
      try {
        const matches = await searchDocuments(query);
        setResults(matches as unknown as SearchResultItem[]);
        setHasSearched(true);
      } catch (err) {
        console.error(err);
      }
    });
  }

  function handleOpenCitation(chunkId: string) {
    setSelectedChunkId(chunkId);
    setDrawerOpen(true);
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary font-medium text-xs mb-1">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Hybrid Vector & Keyword Engine</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Semantic Knowledge Search
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Perform deep semantic search powered by Pinecone dense vectors, PostgreSQL sparse search, and Cohere cross-encoder reranking.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search concepts, technical keywords, or natural language questions..."
            className="h-14 w-full rounded-2xl border bg-card/80 pl-12 pr-12 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 shadow-xs"
          />
          {isPending && (
            <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-primary" />
          )}
        </div>
      </form>

      {/* Results */}
      {!hasSearched ? (
        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center bg-muted/10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <SearchIcon className="h-7 w-7" />
          </div>

          <h2 className="mt-5 text-base font-semibold">
            Search your knowledge base
          </h2>

          <p className="mt-2 max-w-sm text-xs text-muted-foreground leading-relaxed">
            Enter a question or topic above to retrieve the most semantically relevant chunks across all your documents.
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center bg-muted/10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <FileText className="h-7 w-7" />
          </div>

          <h2 className="mt-5 text-base font-semibold">No relevant chunks found</h2>

          <p className="mt-2 max-w-sm text-xs text-muted-foreground leading-relaxed">
            No document passages matched &ldquo;{query}&rdquo;. Ensure your documents are indexed and try different search terms.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Found {results.length} reranked passage{results.length !== 1 ? "s" : ""} for{" "}
              <span className="font-semibold text-foreground">&ldquo;{query}&rdquo;</span>
            </p>
          </div>

          <div className="space-y-3">
            {results.map((result) => {
              const matchPct = Math.round(result.score * 100);

              return (
                <div
                  key={result.chunkId}
                  className="rounded-2xl border bg-card/70 p-5 backdrop-blur-xs transition-all hover:border-primary/40 shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <Link
                        href={`/dashboard/documents/${result.documentId}`}
                        className="text-xs font-semibold hover:underline"
                      >
                        {result.title}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        ({result.fileName})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {matchPct > 0 && (
                        <Badge
                          variant="secondary"
                          className="h-5 px-2 text-xs font-mono font-medium"
                        >
                          {matchPct}% Match
                        </Badge>
                      )}

                      {result.pageNumber && (
                        <Badge variant="outline" className="text-xs">
                          Page {result.pageNumber}
                        </Badge>
                      )}

                      {result.sectionTitle && (
                        <Badge variant="outline" className="text-xs max-w-[180px] truncate">
                          {result.sectionTitle}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Snippet */}
                  <p className="text-xs font-mono leading-relaxed whitespace-pre-wrap text-foreground/90 bg-muted/20 p-3 rounded-xl">
                    {result.content}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenCitation(result.chunkId)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline cursor-pointer"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Inspect Grounded Source</span>
                    </button>

                    <Link
                      href={`/dashboard/documents/${result.documentId}`}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <span>View Document</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Citation Drawer */}
      <CitationDrawer
        chunkId={selectedChunkId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
