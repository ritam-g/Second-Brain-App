import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, CalendarDays, SearchX, Sparkles } from 'lucide-react';
import GlassCard from './ui/GlassCard';
import TagChip from './content/TagChip';
import Button from './ui/Button';
import ContentPreview from './ContentPreview';
import { getSavedTimeLabel, getSourceLabel, getTypeBadge } from './content/utils/contentMetadata.utils';

// Chunk-level semantic search results view used by the dashboard search experience.
// Input: normalized semantic search results, current query, loading/error state, and retry callback.
// Output: premium glass result list with matched chunk context.
const SearchResults = ({
  query,
  results = [],
  loading = false,
  error = '',
  onRetry,
}) => {
  const MotionArticle = motion.article;

  if (loading) {
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <SearchResultSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <GlassCard className="mx-auto max-w-3xl px-6 py-10 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-300">Semantic Search Error</p>
        <h2 className="mt-4 text-2xl font-bold text-[#fff1d5]">The knowledge query could not be completed.</h2>
        <p className="mt-3 text-sm leading-7 text-obsidian-400">{error}</p>
        {onRetry ? (
          <Button type="button" variant="amber" className="mt-6 rounded-2xl px-5 py-3" onClick={onRetry}>
            Retry Search
          </Button>
        ) : null}
      </GlassCard>
    );
  }

  if (!results.length) {
    return (
      <GlassCard className="mx-auto max-w-3xl px-6 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(248,174,29,0.12)] text-accent">
          <SearchX className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-2xl font-bold text-[#fff1d5]">No semantic matches found</h2>
        <p className="mt-3 text-sm leading-7 text-obsidian-400">
          Try broadening the question or asking with different wording. PDF and image OCR content are searched through Pinecone, not local keywords.
        </p>
      </GlassCard>
    );
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 rounded-[26px] border border-[rgba(255,204,102,0.08)] bg-[rgba(20,15,12,0.68)] px-5 py-5 backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,191,64,0.18)] bg-[rgba(255,174,32,0.08)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
            <BrainCircuit className="h-3.5 w-3.5" />
            Semantic Retrieval
          </div>
          <h2 className="mt-4 text-2xl font-bold text-[#fff1d5]">Results for "{query}"</h2>
          <p className="mt-2 text-sm leading-7 text-obsidian-400">
            Each result below is grounded in the most relevant retrieved chunk, not a frontend keyword match.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-obsidian-500">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          {results.length} chunk matches
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {results.map((result, index) => (
          <MotionArticle
            key={result.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: index * 0.04 }}
          >
            <SearchResultCard result={result} />
          </MotionArticle>
        ))}
      </div>
    </section>
  );
};

function SearchResultCard({ result }) {
  const typeBadge = getTypeBadge(result);
  const sourceLabel = getSourceLabel(result);
  const savedTimeLabel = getSavedTimeLabel(result);
  const scoreValue = Number.isFinite(result?.score) ? `${Math.round(result.score * 100)}%` : null;

  return (
    <GlassCard className="overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
        <ContentPreview content={result} compact className="rounded-none border-0 border-r border-[rgba(255,204,102,0.08)]" />

        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-[rgba(255,204,102,0.12)] bg-[rgba(255,255,255,0.03)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-accent-soft">
              {typeBadge}
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-obsidian-500">{sourceLabel}</span>
            {savedTimeLabel ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.02)] px-2.5 py-1 text-[10px] font-semibold text-obsidian-400">
                <CalendarDays className="h-3.5 w-3.5" />
                {savedTimeLabel}
              </span>
            ) : null}
            {scoreValue ? (
              <span className="ml-auto text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                {scoreValue} match
              </span>
            ) : null}
          </div>

          <h3 className="mt-4 text-xl font-bold leading-tight text-[#fff1d5]">{result.title}</h3>

          <div className="mt-4 rounded-[22px] border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-soft">Matched Chunk</p>
            <p className="mt-3 text-sm leading-7 text-obsidian-300">
              {result.matchedChunkText || result.description || 'Relevant content was found, but the chunk text was not returned by the backend.'}
            </p>
          </div>

          {result.tags?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {result.tags.slice(0, 4).map((tag) => (
                <TagChip key={`${result.id}-${tag}`} label={tag} tone="muted" className="max-w-[132px] truncate" />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </GlassCard>
  );
}

function SearchResultSkeleton() {
  return (
    <GlassCard className="overflow-hidden">
      <div className="grid animate-pulse gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="h-40 bg-[rgba(255,255,255,0.04)] lg:h-full" />
        <div className="space-y-4 p-5">
          <div className="h-3 w-24 rounded-full bg-[rgba(255,255,255,0.06)]" />
          <div className="h-7 w-3/4 rounded-full bg-[rgba(255,255,255,0.06)]" />
          <div className="rounded-[22px] border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
            <div className="h-3 w-24 rounded-full bg-[rgba(255,255,255,0.05)]" />
            <div className="mt-4 h-4 w-full rounded-full bg-[rgba(255,255,255,0.04)]" />
            <div className="mt-3 h-4 w-5/6 rounded-full bg-[rgba(255,255,255,0.04)]" />
            <div className="mt-3 h-4 w-2/3 rounded-full bg-[rgba(255,255,255,0.04)]" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export default SearchResults;
