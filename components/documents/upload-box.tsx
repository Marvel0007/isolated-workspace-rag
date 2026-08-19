"use client";

import { ChangeEvent, useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { uploadDocument } from "@/actions/documents/upload-document";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

export function UploadBox() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setError("");

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("File must be smaller than 20MB.");
      return;
    }

    if (
      selectedFile.type !== "application/pdf" &&
      selectedFile.type !== "text/plain"
    ) {
      setFile(null);
      setError("Only PDF and text files are supported.");
      return;
    }

    setFile(selectedFile);
  }

  function removeFile() {
    setFile(null);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleUpload() {
    if (!file) {
      setError("Please select a file.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      await uploadDocument(formData);

      removeFile();

      window.location.reload();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Upload failed."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Upload className="h-5 w-5 text-muted-foreground" />
        </div>

        <h3 className="mt-4 font-semibold">
          Upload a document
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          PDF or TXT files up to 20MB
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          onChange={handleFileChange}
          className="hidden"
        />

        {!file ? (
          <Button
            type="button"
            variant="outline"
            className="mt-5"
            onClick={() => inputRef.current?.click()}
          >
            Choose file
          </Button>
        ) : (
          <div className="mt-5 w-full max-w-md">
            <div className="flex items-center gap-3 rounded-lg border p-3 text-left">
              <FileText className="h-5 w-5 shrink-0" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {file.name}
                </p>

                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={removeFile}
                disabled={uploading}
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Button
              type="button"
              className="mt-3 w-full"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload document"}
            </Button>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}