import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { syncCurrentUser } from "@/actions/users";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { user, workspace } = await syncCurrentUser();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm text-muted-foreground">
        Welcome back
      </p>

      <h1 className="mt-1 text-3xl font-bold">
        {user.name}
      </h1>

      <div className="mt-8 rounded-xl border p-6">
        <p className="text-sm text-muted-foreground">
          Current workspace
        </p>

        <h2 className="mt-1 text-xl font-semibold">
          {workspace.name}
        </h2>
      </div>
    </main>
  );
}