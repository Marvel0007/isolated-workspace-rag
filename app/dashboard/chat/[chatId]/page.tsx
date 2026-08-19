import ChatWindow from "@/components/chat/chat-window";

type PageProps = {
  params: Promise<{
    chatId: string;
  }>;
};

export default async function ChatPage({
  params,
}: PageProps) {
  const { chatId } = await params;

  return (
    <main className="h-[calc(100vh-4rem)]">
      <ChatWindow chatId={chatId} />
    </main>
  );
}