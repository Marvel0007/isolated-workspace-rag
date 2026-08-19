"use server";

import { put } from "@vercel/blob";

import { requireCurrentWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "text/plain",
];

export async function uploadDocument(formData: FormData) {
  const workspace = await requireCurrentWorkspace();

  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("No file provided");
  }

  if (file.size === 0) {
    throw new Error("File is empty");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size must be less than 20MB");
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Only PDF and text files are supported");
  }

  const blob = await put(
    `workspaces/${workspace.id}/${crypto.randomUUID()}-${file.name}`,
    file,
    {
      access: "public",
    }
  );

  const document = await prisma.document.create({
    data: {
      title: file.name.replace(/\.[^/.]+$/, ""),
      fileName: file.name,
      fileUrl: blob.url,
      fileType: file.type,
      fileSize: file.size,
      status: "PROCESSING",
      workspaceId: workspace.id,
    },
  });

  return document;
}