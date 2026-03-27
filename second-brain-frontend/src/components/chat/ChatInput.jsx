import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { ArrowUp, Paperclip } from 'lucide-react';
import { motion } from 'framer-motion';

const MIN_TEXTAREA_HEIGHT = 46;
const MAX_TEXTAREA_HEIGHT = 140;
const MotionDiv = motion.div;
const MotionButton = motion.button;

// Premium composer used by Deep Focus. Keeps a compact default height and grows only while the user types.
const ChatInput = ({
  value = '',
  onChange,
  disabled = false,
  inputRef,
  onSubmitShortcut,
}) => {
  const internalRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!inputRef) {
      return undefined;
    }

    if (typeof inputRef === 'function') {
      inputRef(internalRef.current);
      return () => inputRef(null);
    }

    inputRef.current = internalRef.current;
    return () => {
      inputRef.current = null;
    };
  }, [inputRef]);

  useLayoutEffect(() => {
    const textarea = internalRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = `${MIN_TEXTAREA_HEIGHT}px`;

    const nextHeight = Math.min(Math.max(textarea.scrollHeight, MIN_TEXTAREA_HEIGHT), MAX_TEXTAREA_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
  }, [value]);

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();

    if (disabled || !String(value || '').trim()) {
      return;
    }

    onSubmitShortcut?.();
  };

  const canSubmit = !disabled && String(value || '').trim().length > 0;

  return (
    <div className="space-y-3">
      <MotionDiv
        animate={isFocused ? {
          boxShadow: '0 0 0 1px rgba(255,191,64,0.18), 0 24px 60px rgba(0,0,0,0.32)',
          y: -1,
        } : {
          boxShadow: '0 16px 40px rgba(0,0,0,0.24)',
          y: 0,
        }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className={clsx(
          'flex items-end gap-3 rounded-[28px] border border-[rgba(255,204,102,0.08)]',
          'bg-[linear-gradient(180deg,rgba(27,21,18,0.95),rgba(18,14,12,0.96))] px-3 py-3 backdrop-blur-2xl',
        )}
      >
        <MotionButton
          type="button"
          disabled
          aria-label="Attachments coming soon"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.02)] text-obsidian-500 opacity-70"
        >
          <Paperclip className="h-[18px] w-[18px]" />
        </MotionButton>

        <textarea
          ref={internalRef}
          value={value}
          disabled={disabled}
          rows={1}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Ask anything about your knowledge..."
          className={clsx(
            'max-h-[140px] min-h-[46px] flex-1 resize-none bg-transparent px-1 py-[11px] text-sm leading-6 text-[#fff1d8] outline-none placeholder:text-obsidian-500',
            'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[rgba(255,204,102,0.12)]',
          )}
        />

        <MotionButton
          type="submit"
          aria-label="Send message"
          disabled={!canSubmit}
          whileHover={canSubmit ? { scale: 1.03, y: -1 } : undefined}
          whileTap={canSubmit ? { scale: 0.97 } : undefined}
          className={clsx(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-200',
            canSubmit
              ? 'bg-[linear-gradient(135deg,#ffcb6d,#f4a72d)] text-obsidian-950 shadow-[0_16px_30px_rgba(244,167,45,0.24)]'
              : 'border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)] text-obsidian-500',
          )}
        >
          <ArrowUp className="h-[18px] w-[18px]" />
        </MotionButton>
      </MotionDiv>

      <div className="flex items-center justify-between gap-3 px-1 text-[11px] font-medium text-obsidian-500">
        <p>Enter to send, Shift+Enter for a new line.</p>
        <p>{disabled ? 'Generating response...' : 'Grounded in your saved archive.'}</p>
      </div>
    </div>
  );
};

export default ChatInput;
