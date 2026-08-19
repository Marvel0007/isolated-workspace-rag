"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  FileText,
  Home,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Star,
  Trash2,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const navigation = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Documents",
    href: "/dashboard/documents",
    icon: FileText,
  },
  {
    label: "AI Assistant",
    href: "/dashboard/chat",
    icon: MessageSquare,
  },
  {
    label: "Search",
    href: "/dashboard/search",
    icon: Search,
  },
  {
    label: "Favorites",
    href: "/dashboard/favorites",
    icon: Star,
  },
  {
    label: "Trash",
    href: "/dashboard/trash",
    icon: Trash2,
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background transition-colors hover:bg-muted md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-72 p-0"
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Brain className="h-4 w-4" />
            </div>

            <span>BrainDock</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 p-3">
          {navigation.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />

                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Settings */}
          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              pathname.startsWith("/dashboard/settings")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Settings className="h-4 w-4 shrink-0" />

            <span>Settings</span>
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}