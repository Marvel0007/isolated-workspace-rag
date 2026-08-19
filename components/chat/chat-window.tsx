"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";

import SourceDialog from "./source-dialog";

import { Copy, Check, RefreshCw } from "lucide-react";
import { regenerateMessage } from "@/actions/chat/regenerate-message";

import { useEffect, useRef, useState } from "react";
import { getChatMessages } from "@/actions/chat/get-messages";
import { sendMessage } from "@/actions/chat/send-message";

type Message = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: Date;
  sources?: Source[];
};

type Source = {
  chunkId: string;
  documentId: string;
  title: string;
  fileName: string;
  score: number;
};

type ChatWindowProps = {
  chatId: string;
};

export default function ChatWindow({ chatId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sources, setSources] = useState<Record<string, Source[]>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);

  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);

  useEffect(() => {
    async function loadMessages() {
      try {
        setLoading(true);
        setError("");

        const data = await getChatMessages(chatId);

        setMessages(
          data.map((message) => ({
            ...message,
            sources: Array.isArray(message.sources)
              ? (message.sources as Source[])
              : [],
          })),
        );

        const loadedSources: Record<string, Source[]> = {};

        data.forEach((message) => {
          if (message.role === "ASSISTANT" && Array.isArray(message.sources)) {
            loadedSources[message.id] = message.sources as Source[];
          }
        });

        setSources(loadedSources);
      } catch (error) {
        console.error(error);

        setError("Failed to load messages.");
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, sending]);

  async function handleRegenerate(userMessageId: string) {
    if (regeneratingId) {
      return;
    }

    setError("");
    setRegeneratingId(userMessageId);

    try {
      const result = await regenerateMessage(chatId, userMessageId);

      const assistantMessage: Message = {
        id: result.message.id,
        role: result.message.role,
        content: result.message.content,
        createdAt: result.message.createdAt,
        sources: Array.isArray(result.message.sources)
          ? (result.message.sources as Source[])
          : [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      setSources((prev) => ({
        ...prev,
        [assistantMessage.id]: assistantMessage.sources ?? [],
      }));

      router.refresh();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to regenerate response.",
      );
    } finally {
      setRegeneratingId(null);
    }
  }

  async function handleCopy(messageId: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);

      setCopiedId(messageId);

      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy message:", error);

      setError("Failed to copy response.");
    }
  }

  function handleSourceClick(chunkId: string) {
    setSelectedChunkId(chunkId);
    setSourceDialogOpen(true);
  }

  async function handleSend() {
    const content = input.trim();

    if (!content || sending) {
      return;
    }

    setInput("");
    setError("");
    setSending(true);

    const temporaryMessage: Message = {
      id: crypto.randomUUID(),
      role: "USER",
      content,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, temporaryMessage]);

    try {
      const result = await sendMessage(chatId, content);

      const assistantMessage: Message = {
        id: result.message.id,
        role: result.message.role,
        content: result.message.content,
        createdAt: result.message.createdAt,
        sources: Array.isArray(result.message.sources)
          ? (result.message.sources as Source[])
          : [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      setSources((prev) => ({
        ...prev,
        [assistantMessage.id]: assistantMessage.sources ?? [],
      }));

      router.refresh();

      window.dispatchEvent(new Event("chat-updated"));
    } catch (error) {
      console.error(error);

      setMessages((prev) =>
        prev.filter((message) => message.id !== temporaryMessage.id),
      );

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6">
          {messages.length === 0 && (
            <div className="flex min-h-[50vh] items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-semibold">Ask BrainDock</h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  Ask anything about your uploaded documents.
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.role === "USER";

            return (
              <div
                key={message.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    isUser
                      ? "flex max-w-[85%] flex-col items-end sm:max-w-[75%]"
                      : "max-w-[85%] sm:max-w-[75%]"
                  }
                >
                  {/* Message bubble */}
                  <div
                    className={
                      isUser
                        ? "rounded-2xl rounded-br-md bg-primary px-4 py-3 text-primary-foreground"
                        : "rounded-2xl rounded-bl-md border bg-muted px-4 py-3"
                    }
                  >
                    {message.role === "ASSISTANT" ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {message.content}
                      </p>
                    )}

                    {/* Sources */}
                    {message.role === "ASSISTANT" &&
                      sources[message.id]?.length > 0 && (
                        <div className="mt-4 border-t pt-3">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-xs font-semibold">Sources</p>

                            <span className="text-[11px] text-muted-foreground">
                              {sources[message.id].length} sources
                            </span>
                          </div>

                          <div className="space-y-2">
                            {sources[message.id].slice(0, 3).map((source) => {
                              const similarity =
                                Math.round(source.score * 1000) / 10;

                              return (
                                <button
                                  type="button"
                                  key={source.chunkId}
                                  onClick={() =>
                                    handleSourceClick(source.chunkId)
                                  }
                                  className="w-full rounded-xl border bg-background p-3 text-left transition-colors hover:bg-muted/50"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm">
                                      📄
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-xs font-semibold">
                                        {source.fileName}
                                      </p>

                                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                        {source.title}
                                      </p>

                                      <div className="mt-2 flex items-center gap-2">
                                        <span className="text-[11px] text-muted-foreground">
                                          Similarity
                                        </span>

                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                          <div
                                            className="h-full rounded-full bg-primary"
                                            style={{
                                              width: `${Math.min(
                                                similarity,
                                                100,
                                              )}%`,
                                            }}
                                          />
                                        </div>

                                        <span className="text-[11px] font-medium">
                                          {similarity}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Regenerate button */}
                  {isUser && (
                    <button
                      type="button"
                      onClick={() => handleRegenerate(message.id)}
                      disabled={!!regeneratingId || sending}
                      className="mt-1 flex items-center gap-1 px-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${
                          regeneratingId === message.id ? "animate-spin" : ""
                        }`}
                      />

                      {regeneratingId === message.id
                        ? "Regenerating..."
                        : "Regenerate"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border bg-muted px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">
                    Thinking
                  </span>

                  <span className="animate-pulse">...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t bg-background">
        <div className="mx-auto w-full max-w-4xl p-4 sm:px-6">
          <div className="flex items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              disabled={sending}
              rows={1}
              placeholder="Ask about your documents..."
              className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "..." : "Send"}
            </button>
          </div>

          <p className="mt-2 text-center text-xs text-muted-foreground">
            BrainDock can make mistakes. Verify important information.
          </p>
        </div>
      </div>
      <SourceDialog
        chunkId={selectedChunkId}
        open={sourceDialogOpen}
        onOpenChange={setSourceDialogOpen}
      />
    </div>
  );
}
