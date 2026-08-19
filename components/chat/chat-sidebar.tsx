"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createChat } from "@/actions/chat/create-chat";
import { getChats } from "@/actions/chat/get-chats";
import { Pencil, Trash2 } from "lucide-react";
import { renameChat } from "@/actions/chat/rename-chat";
import { deleteChat } from "@/actions/chat/delete-chat";

type Chat = {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export default function ChatSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [editingChatId, setEditingChatId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [editingTitle, setEditingTitle] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function loadChats() {
    try {
      const data = await getChats();
      setChats(data);
    } catch (error) {
      console.error("Failed to load chats:", error);
    }
  }

  async function handleDeleteChat(chatId: string) {
    try {
      await deleteChat(chatId);

      setChats((prev) => prev.filter((chat) => chat.id !== chatId));

      if (pathname === `/dashboard/chat/${chatId}`) {
        router.push("/dashboard/chat");
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  }

  async function handleRenameChat(chatId: string) {
    const title = editingTitle.trim();

    if (!title) return;

    try {
      const updatedChat = await renameChat(chatId, title);

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                title: updatedChat.title,
                updatedAt: updatedChat.updatedAt,
              }
            : chat,
        ),
      );

      setEditingChatId(null);
      setEditingTitle("");
    } catch (error) {
      console.error("Failed to rename chat:", error);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getChats();

        if (!cancelled) {
          setChats(data);
        }
      } catch (error) {
        console.error("Failed to load chats:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleChatUpdated = () => {
      loadChats();
    };

    window.addEventListener("chat-updated", handleChatUpdated);

    return () => {
      window.removeEventListener("chat-updated", handleChatUpdated);
    };
  }, []);

  async function handleNewChat() {
    if (creating) return;

    try {
      setCreating(true);

      const chat = await createChat("New Chat");

      setChats((prev) => [chat, ...prev]);

      router.push(`/dashboard/chat/${chat.id}`);
    } catch (error) {
      console.error("Failed to create chat:", error);
    } finally {
      setCreating(false);
    }
  }

  const filteredChats = chats.filter((chat) =>
    (chat.title || "Untitled Chat")
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  return (
    <aside className="flex h-full w-72 flex-col border-r bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h2 className="font-semibold">Chat History</h2>

          <p className="text-xs text-muted-foreground">Your conversations</p>
        </div>
      </div>

      <div className="px-3 pb-2">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search chats..."
          className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* New Chat */}
      <div className="p-3">
        <button
          type="button"
          onClick={handleNewChat}
          disabled={creating}
          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating ? "Creating..." : "+ New Chat"}
        </button>
      </div>

      {/* Chat List */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <div className="space-y-2 p-2">
            <div className="h-10 animate-pulse rounded-lg bg-muted" />
            <div className="h-10 animate-pulse rounded-lg bg-muted" />
            <div className="h-10 animate-pulse rounded-lg bg-muted" />
          </div>
        ) : chats.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">No chats yet</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">No chats found</p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-2 text-xs font-medium text-primary hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredChats.map((chat) => {
              const isActive = pathname === `/dashboard/chat/${chat.id}`;

              return (
                <div
                  key={chat.id}
                  className={`group flex items-center gap-1 rounded-xl transition-colors ${
                    isActive ? "bg-muted" : "hover:bg-muted/60"
                  }`}
                >
                  {editingChatId === chat.id ? (
                    <div className="flex min-w-0 flex-1 items-center gap-2 p-2">
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(event) =>
                          setEditingTitle(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            handleRenameChat(chat.id);
                          }

                          if (event.key === "Escape") {
                            setEditingChatId(null);
                            setEditingTitle("");
                          }
                        }}
                        className="min-w-0 flex-1 rounded-lg border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />

                      <button
                        type="button"
                        onClick={() => handleRenameChat(chat.id)}
                        className="rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-muted"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      <Link
                        href={`/dashboard/chat/${chat.id}`}
                        className="min-w-0 flex-1 px-3 py-3"
                      >
                        <p className="truncate text-sm font-medium">
                          {chat.title || "Untitled Chat"}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatChatDate(chat.updatedAt)}
                        </p>
                      </Link>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();

                          setEditingChatId(chat.id);
                          setEditingTitle(chat.title || "");
                        }}
                        className="mr-1 rounded-lg p-2 text-muted-foreground opacity-0 transition-all hover:bg-muted group-hover:opacity-100"
                        aria-label="Rename chat"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();

                          handleDeleteChat(chat.id);
                        }}
                        className="mr-2 rounded-lg p-2 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        aria-label="Delete chat"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

function formatChatDate(date: Date) {
  const now = new Date();

  const chatDate = new Date(date);

  const isToday = now.toDateString() === chatDate.toDateString();

  if (isToday) {
    return chatDate.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return chatDate.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
}
