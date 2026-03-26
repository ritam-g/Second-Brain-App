import React, { useEffect, useRef } from 'react';
import { ArrowUp, MessagesSquare } from 'lucide-react';
import GlassCard from './ui/GlassCard';
import Button from './ui/Button';
import MessageBubble from './MessageBubble';

// Scrollable chat interface for Deep Focus retrieval conversations.
// Input: messages, draft value, loading state, and submit/change handlers.
// Output: chat transcript with sticky composer.
const ChatBox = ({
  messages = [],
  draft = '',
  onDraftChange,
  onSubmit,
  loading = false,
  inputRef,
}) => {
  const transcriptRef = useRef(null);

  useEffect(() => {
    const transcriptNode = transcriptRef.current;

    if (!transcriptNode) {
      return;
    }

    transcriptNode.scrollTop = transcriptNode.scrollHeight;
  }, [messages, loading]);

  return (
    <GlassCard className="flex h-[calc(100vh-12rem)] min-h-[42rem] flex-col overflow-hidden">
      <div className="border-b border-[rgba(255,204,102,0.08)] px-6 py-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,191,64,0.18)] bg-[rgba(255,174,32,0.08)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          <MessagesSquare className="h-3.5 w-3.5" />
          Chat with Knowledge
        </div>
        <h1 className="mt-4 text-2xl font-bold text-[#fff1d5]">Deep Focus</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-obsidian-400">
          Ask questions against your uploaded documents, OCR content, and saved references. Answers are grounded in the top retrieved chunks from your knowledge base.
        </p>
      </div>

      <div ref={transcriptRef} className="obsidian-scroll flex-1 space-y-5 overflow-y-auto px-6 py-6">
        {messages.length ? (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              role={message.role}
              text={message.text}
              sources={message.sources}
              timestamp={message.timestamp}
            />
          ))
        ) : (
          <EmptyChatState />
        )}

        {loading ? (
          <div className="flex gap-3">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[rgba(248,174,29,0.14)] text-accent">
              <MessagesSquare className="h-5 w-5" />
            </div>
            <div className="rounded-[24px] rounded-bl-[8px] border border-[rgba(255,204,102,0.08)] bg-[rgba(25,19,16,0.88)] px-5 py-4 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-sm text-obsidian-400">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />
                Retrieving relevant knowledge...
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="border-t border-[rgba(255,204,102,0.08)] bg-[rgba(15,11,9,0.72)] p-5">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="Ask about a resume, OCR image, article, or saved document..."
            rows={3}
            className="min-h-[5.5rem] flex-1 resize-none rounded-[22px] border border-[rgba(255,204,102,0.08)] bg-[rgba(23,18,15,0.92)] px-4 py-3 text-sm text-obsidian-200 outline-none transition-colors focus:border-[rgba(255,191,64,0.24)]"
          />
          <Button
            type="submit"
            variant="amber"
            loading={loading}
            className="self-end rounded-2xl px-5 py-3"
            trailingIcon={!loading ? <ArrowUp className="h-4 w-4" /> : null}
          >
            Ask
          </Button>
        </div>
      </form>
    </GlassCard>
  );
};

function EmptyChatState() {
  return (
    <div className="flex h-full min-h-[20rem] items-center justify-center">
      <div className="max-w-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[rgba(248,174,29,0.12)] text-accent">
          <MessagesSquare className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-2xl font-bold text-[#fff1d5]">Start a retrieval-grounded conversation</h2>
        <p className="mt-3 text-sm leading-7 text-obsidian-400">
          Ask natural language questions and Deep Focus will pull the most relevant chunks from your PDFs, images, and saved content.
        </p>
      </div>
    </div>
  );
}

export default ChatBox;
