import ChatSidebar from "@/components/chat/chat-sidebar";

type ChatLayoutProps = {
  children: React.ReactNode;
};

export default function ChatLayout({
  children,
}: ChatLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <ChatSidebar />

      <main className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}