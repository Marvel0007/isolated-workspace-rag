import { getTrashedDocuments } from "@/actions/documents/manage-documents";
import { TrashContent } from "@/components/documents/trash-content";

export default async function TrashPage() {
  const documents = await getTrashedDocuments();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Trash
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage deleted documents. Restore or permanently remove them.
        </p>
      </div>

      <TrashContent documents={documents} />
    </div>
  );
}
