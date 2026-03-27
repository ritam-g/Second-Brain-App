import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessagesSquare, Sparkles } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';

const MotionDiv = motion.div;

// Main Deep Focus chat surface. Preserves the current data flow while upgrading the visual hierarchy and interaction model.
const ChatContainer = ({
  messages = [],
  draft = '',
  onDraftChange,
  onSubmit,
  loading = false,
  inputRef,
}) => {
  const transcriptRef = useRef(null);
  const bottomAnchorRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    const transcriptNode = transcriptRef.current;

    if (!transcriptNode) {
      return;
    }

    const prefersReducedMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    transcriptNode.scrollTo({
      top: transcriptNode.scrollHeight,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, [messages, loading]);

  return (
    <div className="mx-auto w-full max-w-[1180px]">
      <GlassCard className="relative isolate flex min-h-[34rem] flex-col overflow-hidden md:h-[calc(100dvh-11rem)] md:min-h-[42rem]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(248,174,29,0.12),transparent_68%)]" />
          <div className="absolute -right-10 top-20 h-48 w-48 rounded-full bg-[rgba(128,198,255,0.08)] blur-3xl" />
          <div className="absolute bottom-0 left-10 h-56 w-56 rounded-full bg-[rgba(248,174,29,0.08)] blur-3xl" />
        </div>

        <div className="relative border-b border-[rgba(255,204,102,0.08)] px-5 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,191,64,0.18)] bg-[rgba(255,174,32,0.08)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                <MessagesSquare className="h-3.5 w-3.5" />
                Deep Focus
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-[-0.03em] text-[#fff1d5] sm:text-[2.6rem]">
                AI Assistant
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-obsidian-400 sm:text-[15px]">
                Ask about saved PDFs, OCR captures, links, and research. Each answer is grounded in retrieved context from your archive before the model responds.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-obsidian-500">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.02)] px-3 py-2">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                {loading ? 'Reasoning...' : `${messages.length} message${messages.length === 1 ? '' : 's'}`}
              </div>
              <div className="inline-flex items-center rounded-full border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.02)] px-3 py-2">
                Retrieval grounded
              </div>
            </div>
          </div>
        </div>

        <div
          ref={transcriptRef}
          className="obsidian-scroll relative flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8"
        >
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 sm:gap-6">
            {messages.length ? (
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    text={message.text}
                    sources={message.sources}
                    timestamp={message.timestamp}
                  />
                ))}
              </AnimatePresence>
            ) : (
              <EmptyChatState />
            )}

            <AnimatePresence>
              {loading ? <ThinkingMessage key="thinking" /> : null}
            </AnimatePresence>

            <div ref={bottomAnchorRef} />
          </div>
        </div>

        <div className="relative border-t border-[rgba(255,204,102,0.08)] bg-[linear-gradient(180deg,rgba(15,11,9,0.76),rgba(15,11,9,0.96))] px-4 py-4 backdrop-blur-2xl sm:px-6 sm:py-5 lg:px-8">
          <div className="mx-auto w-full max-w-5xl">
            <form ref={formRef} onSubmit={onSubmit}>
              <ChatInput
                value={draft}
                onChange={onDraftChange}
                disabled={loading}
                inputRef={inputRef}
                onSubmitShortcut={() => formRef.current?.requestSubmit()}
              />
            </form>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

function EmptyChatState() {
  const starterPrompts = [
    'Summarize what I saved this week.',
    'Find the strongest ideas across my PDFs.',
    'What themes connect my recent research?',
  ];

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="flex min-h-[24rem] flex-col items-center justify-center rounded-[32px] border border-dashed border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.02)] px-6 py-10 text-center"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] border border-[rgba(255,191,64,0.16)] bg-[rgba(255,174,32,0.08)] text-accent">
        <MessagesSquare className="h-7 w-7" />
      </div>
      <h2 className="mt-6 text-2xl font-bold text-[#fff1d5] sm:text-[2rem]">Start a grounded conversation</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-obsidian-400">
        Ask a focused question and Deep Focus will retrieve relevant context from your archive before composing the answer.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
        {starterPrompts.map((prompt) => (
          <span
            key={prompt}
            className="rounded-full border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-xs font-medium text-obsidian-400"
          >
            {prompt}
          </span>
        ))}
      </div>
    </MotionDiv>
  );
}

function ThinkingMessage() {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex gap-3 sm:gap-4"
    >
      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[rgba(255,191,64,0.14)] bg-[rgba(255,174,32,0.1)] text-accent shadow-[0_14px_30px_rgba(0,0,0,0.18)]">
        <MessagesSquare className="h-5 w-5" />
      </div>

      <div className="w-full max-w-[min(100%,36rem)]">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-obsidian-500">
          <span>AI Assistant</span>
          <span className="text-obsidian-600">thinking</span>
        </div>

        <div className="rounded-[26px] rounded-bl-[10px] border border-[rgba(255,204,102,0.08)] bg-[linear-gradient(180deg,rgba(29,23,20,0.96),rgba(18,14,12,0.96))] px-5 py-4 shadow-[0_24px_45px_rgba(0,0,0,0.2)] backdrop-blur-xl">
          <div className="flex items-center gap-2.5 text-sm text-obsidian-400">
            <span className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.2s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-accent/90 [animation-delay:-0.1s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-accent/70" />
            </span>
            Retrieving context and composing an answer...
          </div>
        </div>
      </div>
    </MotionDiv>
  );
}

export default ChatContainer;
