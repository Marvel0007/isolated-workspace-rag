"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createChat } from "@/actions/chat/create-chat";

export default function ChatPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCreateChat() {
    try {
      setLoading(true);

      const chat = await createChat("New Chat");

      router.push(`/dashboard/chat/${chat.id}`);
    } catch (error) {
      console.error("Failed to create chat:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">
          BrainDock Chat
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Start a conversation with your documents.
        </p>

        <button
          onClick={handleCreateChat}
          disabled={loading}
          className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Creating..." : "New Chat"}
        </button>
      </div>
    </main>
  );
}