import React from 'react';
import { CalendarDays, ExternalLink } from 'lucide-react';
import ContentPreview from '../../components/ContentPreview';
import {
  getDestinationUrl,
  getDisplayDescription,
  getDisplayTitle,
  getSavedTimeLabel,
  getSourceLabel,
  getTypeBadge,
} from '../../components/content/utils';

// Compact card used inside dashboard memory resurfacing sections.
// Input: one resurfaced content item.
// Output: premium memory card with preview, metadata, and open action.
const ResurfacedCard = ({
  item,
}) => {
  const destinationUrl = getDestinationUrl(item);
  const displayTitle = getDisplayTitle(item);
  const displayDescription = getDisplayDescription(item);
  const typeBadge = getTypeBadge(item);
  const sourceLabel = getSourceLabel(item);
  const savedTimeLabel = getSavedTimeLabel(item, { conversational: true });
  const formattedDate = formatSavedDate(item?.createdAt);

  return (
    <article className="overflow-hidden rounded-[24px] border border-[rgba(255,204,102,0.08)] bg-[rgba(23,18,15,0.88)] shadow-[0_22px_40px_rgba(0,0,0,0.2)] transition-colors hover:border-[rgba(255,191,64,0.18)]">
      <ContentPreview
        content={item}
        compact
        showOpenHint={false}
        className="rounded-none border-0 border-b border-[rgba(255,204,102,0.08)]"
      />

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,191,64,0.18)] bg-[rgba(255,174,32,0.08)] px-3 py-1 text-[11px] font-semibold text-accent">
            <CalendarDays className="h-3.5 w-3.5" />
            {savedTimeLabel}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-obsidian-500">
            {sourceLabel}
          </span>
          <span className="inline-flex items-center rounded-full border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent-soft">
            {typeBadge}
          </span>
        </div>

        <h3 className="mt-3 text-lg font-bold leading-7 text-[#fff1d5]">
          {displayTitle}
        </h3>
        <p className="mt-2 text-sm leading-6 text-obsidian-400">
          {displayDescription}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(255,204,102,0.08)] pt-4">
          <div className="min-w-0">
            <p className="text-xs text-obsidian-500">{formattedDate}</p>
          </div>

          {destinationUrl && destinationUrl !== '#' ? (
            <a
              href={destinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,191,64,0.18)] bg-[rgba(255,174,32,0.08)] px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:border-[rgba(255,191,64,0.3)] hover:text-[#ffe2a2]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Reopen Memory
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
};

function formatSavedDate(value) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Saved earlier';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsedDate);
}

export default ResurfacedCard;
