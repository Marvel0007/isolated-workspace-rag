import { getDocuments } from "@/actions/documents";

export default async function DocumentTestPage() {
  const documents = await getDocuments();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Document Processing Test
      </h1>

      {documents.map((document) => (
        <div
          key={document.id}
          className="rounded-lg border p-4"
        >
          <p className="font-medium">
            {document.fileName}
          </p>

          <p className="text-sm text-muted-foreground">
            {document.status}
          </p>
        </div>
      ))}
    </div>
  );
}