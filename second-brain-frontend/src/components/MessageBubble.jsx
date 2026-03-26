import React from 'react';
import clsx from 'clsx';
import { Bot, UserRound } from 'lucide-react';
import ContentPreview from './ContentPreview';

// Individual chat bubble used inside Deep Focus conversations.
// Input: role, message text, optional retrieval sources, and timestamp.
// Output: styled user/assistant message bubble with optional source citations.
const MessageBubble = ({
  role = 'assistant',
  text,
  sources = [],
  timestamp = '',
}) => {
  const isUser = role === 'user';

  return (
    <div className={clsx('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser ? (
        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[rgba(248,174,29,0.14)] text-accent">
          <Bot className="h-5 w-5" />
        </div>
      ) : null}

      <div className={clsx('max-w-[min(100%,48rem)]', isUser && 'order-first')}>
        <div
          className={clsx(
            'rounded-[24px] px-5 py-4 text-sm leading-7 shadow-[0_24px_45px_rgba(0,0,0,0.18)]',
            isUser
              ? 'rounded-br-[8px] bg-[linear-gradient(135deg,#ffbf43,#d8871a)] text-obsidian-950'
              : 'rounded-bl-[8px] border border-[rgba(255,204,102,0.08)] bg-[rgba(25,19,16,0.88)] text-obsidian-200 backdrop-blur-xl',
          )}
        >
          <p className="whitespace-pre-wrap">{text}</p>
        </div>

        {!isUser && sources.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {sources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
              />
            ))}
          </div>
        ) : null}

        {timestamp ? (
          <p className={clsx('mt-2 text-xs', isUser ? 'text-right text-obsidian-600' : 'text-obsidian-500')}>
            {timestamp}
          </p>
        ) : null}
      </div>

      {isUser ? (
        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.04)] text-[#fff3db]">
          <UserRound className="h-5 w-5" />
        </div>
      ) : null}
    </div>
  );
};

function SourceCard({ source }) {
  const Wrapper = source.url ? 'a' : 'div';
  const wrapperProps = source.url
    ? {
        href: source.url,
        target: '_blank',
        rel: 'noopener noreferrer',
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="overflow-hidden rounded-[22px] border border-[rgba(255,204,102,0.08)] bg-[rgba(18,14,12,0.88)] transition-colors hover:border-[rgba(255,191,64,0.18)]"
    >
      <ContentPreview
        content={source}
        compact
        showOpenHint={false}
        className="rounded-none border-0 border-b border-[rgba(255,204,102,0.08)]"
      />
      <div className="p-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-soft">{source.type || 'source'}</p>
        <h4 className="mt-2 text-sm font-bold text-[#fff1d5]">{source.title}</h4>
        <p className="mt-2 text-xs leading-6 text-obsidian-400">{source.matchedChunkText}</p>
      </div>
    </Wrapper>
  );
}

export default MessageBubble;
