import React from 'react';
import { CalendarDays, ExternalLink } from 'lucide-react';
import ContentPreview from '../../../components/content/ContentPreview';
import { getSavedTimeLabel } from '../../../components/content/utils';

// Individual source citation card for assistant answers.
// Input: a normalized source object containing preview, title, type, and link metadata.
// Output: premium source card with preview image, description, and open action.
const SourceCard = ({
  source,
}) => {
  const resolvedTitle = String(source?.title || 'Untitled Source').trim();
  const resolvedType = formatTypeLabel(source?.type);
  const resolvedDescription = normalizeDescription(
    source?.description
    || source?.matchedChunkText
    || source?.text,
  );
  const sourceHost = resolveSourceHost(source?.url);
  const scoreLabel = resolveScoreLabel(source?.score);
  const savedTimeLabel = getSavedTimeLabel(source);

  return (
    <article className="overflow-hidden rounded-[24px] border border-[rgba(255,204,102,0.08)] bg-[rgba(23,18,15,0.9)] shadow-[0_22px_40px_rgba(0,0,0,0.2)] transition-colors hover:border-[rgba(255,191,64,0.18)]">
      <ContentPreview
        content={source}
        compact
        showOpenHint={false}
        className="rounded-none border-0 border-b border-[rgba(255,204,102,0.08)]"
      />

      <div className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center rounded-full border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent-soft">
            {resolvedType}
          </span>

          {scoreLabel ? (
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-obsidian-500">
              {scoreLabel}
            </span>
          ) : null}
        </div>

        <h4 className="mt-3 text-base font-bold leading-7 text-[#fff1d5]">{resolvedTitle}</h4>
        {savedTimeLabel ? (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.02)] px-2.5 py-1 text-[10px] font-semibold text-obsidian-400">
              <CalendarDays className="h-3.5 w-3.5" />
              {savedTimeLabel}
            </span>
          </div>
        ) : null}
        <p className="mt-2 text-sm leading-6 text-obsidian-400">
          {resolvedDescription || 'Retrieved context from your archive.'}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(255,204,102,0.08)] pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-obsidian-500">
            {sourceHost || 'Internal archive source'}
          </p>

          {source?.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,191,64,0.18)] bg-[rgba(255,174,32,0.08)] px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:border-[rgba(255,191,64,0.3)] hover:text-[#ffe2a2]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View Source
            </a>
          ) : (
            <span className="inline-flex items-center rounded-full border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-xs font-semibold text-obsidian-400">
              Library Entry
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

function normalizeDescription(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

function formatTypeLabel(type) {
  const normalizedType = String(type || '').toLowerCase();
  const labels = {
    article: 'Article',
    youtube: 'Video',
    video: 'Video',
    pdf: 'PDF',
    document: 'Document',
    image: 'Image',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    tweet: 'Tweet',
    x: 'X',
    github: 'GitHub',
  };

  return labels[normalizedType] || 'Source';
}

function resolveSourceHost(url) {
  try {
    const parsedUrl = new URL(String(url || '').trim());
    return parsedUrl.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function resolveScoreLabel(score) {
  const numericScore = Number(score);

  if (!Number.isFinite(numericScore) || numericScore <= 0) {
    return '';
  }

  return `${Math.round(Math.max(0, Math.min(1, numericScore)) * 100)}% match`;
}

export default SourceCard;
