"use server";

import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export async function syncCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error("User not found");
  }

  const email =
    clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error("User email not found");
  }

  const name =
    [clerkUser.firstName, clerkUser.lastName]
      .filter(Boolean)
      .join(" ") || "User";

  const user = await prisma.user.upsert({
    where: {
      clerkId: userId,
    },
    update: {
      email,
      name,
    },
    create: {
      clerkId: userId,
      email,
      name,
    },
  });

  const workspace = await prisma.workspace.findFirst({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (workspace) {
    return {
      user,
      workspace,
    };
  }

  const newWorkspace = await prisma.workspace.create({
    data: {
      name: "My Workspace",
      userId: user.id,
    },
  });

  return {
    user,
    workspace: newWorkspace,
  };
}