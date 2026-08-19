import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      clerkId: userId,
    },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function getCurrentWorkspace() {
  const user = await requireUser();

  return prisma.workspace.findFirst({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function requireWorkspace() {
  const workspace = await getCurrentWorkspace();

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  return workspace;
}