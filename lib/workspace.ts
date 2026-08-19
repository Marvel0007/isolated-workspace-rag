import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireCurrentWorkspace() {
  const user = await requireUser();

  const workspace = await prisma.workspace.findFirst({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  return workspace;
}