import { UserButton } from "@clerk/nextjs";

import { MobileNav } from "@/components/dashboard/mobile-nav";

export function DashboardHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
      <MobileNav />

      <div className="ml-auto">
        <UserButton />
      </div>
    </header>
  );
}