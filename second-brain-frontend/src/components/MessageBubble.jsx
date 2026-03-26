import React from 'react';
import clsx from 'clsx';
import { Bot, UserRound } from 'lucide-react';
import ChatAnswer from './chat/ChatAnswer';

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
        {isUser ? (
          <div className="rounded-[24px] rounded-br-[8px] bg-[linear-gradient(135deg,#ffbf43,#d8871a)] px-5 py-4 text-sm leading-7 text-obsidian-950 shadow-[0_24px_45px_rgba(0,0,0,0.18)]">
            <p className="whitespace-pre-wrap">{text}</p>
          </div>
        ) : (
          <ChatAnswer answer={text} sources={sources} />
        )}

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

export default MessageBubble;
