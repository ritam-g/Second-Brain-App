import React from 'react';
import clsx from 'clsx';
import { Bot, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import ChatAnswer from '../../features/chat/components/ChatAnswer';

const MotionArticle = motion.article;

const ChatMessage = ({
  role = 'assistant',
  text = '',
  sources = [],
  timestamp = '',
}) => {
  const isUser = role === 'user';

  return (
    <MotionArticle
      layout
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={clsx(
        'flex w-full gap-2 sm:gap-3', // reduced gap
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgba(255,191,64,0.12)] bg-[rgba(255,174,32,0.08)] text-accent shadow-[0_8px_18px_rgba(0,0,0,0.15)]">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div className={clsx('w-full max-w-[min(100%,48rem)]', isUser && 'order-first')}>
        
        {/* Header */}
        <div
          className={clsx(
            'mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em]',
            isUser ? 'justify-end text-obsidian-500' : 'text-obsidian-500'
          )}
        >
          <span>{isUser ? 'You' : 'AI Assistant'}</span>
          {timestamp && (
            <span className="text-obsidian-600 text-[10px]">{timestamp}</span>
          )}
        </div>

        {/* Message */}
        {isUser ? (
          <div className="ml-auto max-w-[min(100%,38rem)] rounded-2xl rounded-br-md border border-[rgba(255,223,169,0.08)] bg-[linear-gradient(135deg,rgba(255,196,90,0.14),rgba(255,163,26,0.08))] px-4 py-2.5 text-[13px] leading-5 text-[#fff4e1] shadow-[0_10px_25px_rgba(0,0,0,0.18)] backdrop-blur-lg">
            <p className="whitespace-pre-wrap break-words">{text}</p>
          </div>
        ) : (
          <ChatAnswer answer={text} sources={sources} />
        )}
      </div>

      {isUser && (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.03)] text-[#fff4df] shadow-[0_8px_18px_rgba(0,0,0,0.12)]">
          <UserRound className="h-4 w-4" />
        </div>
      )}
    </MotionArticle>
  );
};

export default ChatMessage;