import React from 'react';
import { Sparkles } from 'lucide-react';
import AnswerFormatter from './AnswerFormatter';
import SourcesList from './SourcesList';

// Premium assistant answer surface for Deep Focus.
// Input: raw answer text and normalized retrieval sources.
// Output: structured answer section followed by a polished sources grid.
const ChatAnswer = ({
  answer = '',
  sources = [],
}) => {
  const normalizedSources = Array.isArray(sources) ? sources.filter(Boolean) : [];

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-[rgba(255,204,102,0.08)] bg-[linear-gradient(180deg,rgba(30,23,19,0.96),rgba(18,14,12,0.96))] px-5 py-5 shadow-[0_24px_45px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,191,64,0.18)] bg-[rgba(255,174,32,0.08)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            Grounded Answer
          </div>

          {normalizedSources.length ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-obsidian-500">
              {normalizedSources.length} retrieved source{normalizedSources.length === 1 ? '' : 's'}
            </p>
          ) : null}
        </div>

        <div className="mt-5">
          <AnswerFormatter text={answer} hasSources={normalizedSources.length > 0} />
        </div>
      </section>

      {normalizedSources.length ? <SourcesList sources={normalizedSources} /> : null}
    </div>
  );
};

export default ChatAnswer;
