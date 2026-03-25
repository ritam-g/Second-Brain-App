import React, { useEffect, useMemo, useState } from 'react';
import {
  Clock3,
  FileText,
  Layers3,
  PlayCircle,
  Quote,
  SquareCheck,
  SquareDashed,
} from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import TagChip from './TagChip';
import CardOverlayActions from './CardOverlayActions';
import {
  getCardLabel,
  getCardVariant,
  getDestinationUrl,
  getDisplayDescription,
  getDisplayTags,
  getDisplayTitle,
  getDocumentChecklist,
  getFooterMeta,
  getPreviewSource,
  getRelativeTime,
  getSourceLabel,
} from './contentCard.utils';
import { useDeleteContent } from '../../hooks/useContent';

// High-polish content card with multiple visual variants for media, articles, quotes, and documents.
// Input: saved content item and its position in the masonry grid.
// Output: animated card matching the dashboard reference language.
const ContentCard = ({ content, index }) => {
  const { deleteContent, loading } = useDeleteContent();
  const [imageFailed, setImageFailed] = useState(false);

  const variant = getCardVariant(content, index);
  const previewSource = getPreviewSource(content);
  const destinationUrl = getDestinationUrl(content);
  const displayTitle = getDisplayTitle(content);
  const displayDescription = getDisplayDescription(content);
  const displayTags = getDisplayTags(content);
  const cardLabel = getCardLabel(content);
  const relativeTime = getRelativeTime(content);
  const footerMeta = getFooterMeta(content);
  const sourceLabel = getSourceLabel(content);
  const checklistItems = useMemo(() => getDocumentChecklist(content), [content]);

  useEffect(() => {
    setImageFailed(false);
  }, [previewSource]);

  const showPreview = Boolean(previewSource) && !imageFailed && variant !== 'document' && variant !== 'quote';

  const handleDelete = async (event) => {
    event.preventDefault();

    if (window.confirm('Delete this archive entry?')) {
      await deleteContent(content._id);
    }
  };

  return (
    <GlassCard interactive className="group relative overflow-hidden">
      <CardOverlayActions href={destinationUrl} onDelete={handleDelete} loading={loading} />

      {variant === 'quote' ? (
        <QuoteCard
          label={cardLabel}
          title={displayTitle}
          description={displayDescription}
          sourceLabel={sourceLabel}
          relativeTime={relativeTime}
          footerMeta={footerMeta}
        />
      ) : variant === 'document' ? (
        <DocumentCard
          label={cardLabel}
          title={displayTitle}
          checklistItems={checklistItems}
          relativeTime={relativeTime}
          footerMeta={footerMeta}
        />
      ) : variant === 'collection' ? (
        <CollectionCard
          label={cardLabel}
          title={displayTitle}
          description={displayDescription}
          previewSource={showPreview ? previewSource : ''}
          tags={displayTags}
          relativeTime={relativeTime}
        />
      ) : (
        <MediaArticleCard
          label={cardLabel}
          title={displayTitle}
          description={displayDescription}
          previewSource={showPreview ? previewSource : ''}
          tags={displayTags}
          relativeTime={relativeTime}
          footerMeta={footerMeta}
          sourceLabel={sourceLabel}
          onPreviewError={() => setImageFailed(true)}
        />
      )}
    </GlassCard>
  );
};

function MediaArticleCard({
  label,
  title,
  description,
  previewSource,
  tags,
  relativeTime,
  footerMeta,
  sourceLabel,
  onPreviewError,
}) {
  return (
    <div>
      {previewSource ? (
        <div className="relative h-[220px] overflow-hidden border-b border-[rgba(255,204,102,0.08)]">
          <img
            src={previewSource}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
            onError={onPreviewError}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(14,11,9,0.85)] via-transparent to-transparent" />
          <div className="absolute left-5 top-5 inline-flex items-center rounded-full bg-[rgba(15,11,9,0.78)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
            {label}
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden border-b border-[rgba(255,204,102,0.08)] px-5 py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,174,29,0.16),_transparent_42%)]" />
          <div className="relative inline-flex items-center gap-2 rounded-full bg-[rgba(255,255,255,0.03)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent-soft">
            <PlayCircle className="h-3.5 w-3.5" />
            {label}
          </div>
        </div>
      )}

      <div className="p-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-obsidian-500">{sourceLabel}</p>
        <h3 className="mt-3 text-[1.6rem] font-bold leading-tight text-[#fff1d5]">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-obsidian-400">
          {description || 'A saved reference from your archive, ready to revisit when the next idea connects.'}
        </p>

        {tags.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <TagChip key={tag} label={tag} tone="muted" />
            ))}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between border-t border-[rgba(255,204,102,0.08)] pt-4 text-xs text-obsidian-500">
          <span className="inline-flex items-center gap-2">
            <Clock3 className="h-3.5 w-3.5" />
            {relativeTime}
          </span>
          <span>{footerMeta}</span>
        </div>
      </div>
    </div>
  );
}

function QuoteCard({ label, title, description, sourceLabel, relativeTime, footerMeta }) {
  const quoteText = description || title;

  return (
    <div className="p-6">
      <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(129,211,255,0.08)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8fd7ff]">
        <Quote className="h-3.5 w-3.5" />
        {label}
      </div>

      <blockquote className="mt-8 text-[2rem] font-semibold italic leading-tight text-[#fff1d5]">
        "{quoteText}"
      </blockquote>

      <div className="mt-10 border-t border-[rgba(255,204,102,0.08)] pt-4">
        <p className="text-sm text-obsidian-500">Source: {sourceLabel}</p>
        <div className="mt-5 flex items-center justify-between text-xs text-obsidian-500">
          <span>{relativeTime}</span>
          <span>{footerMeta}</span>
        </div>
      </div>
    </div>
  );
}

function DocumentCard({ label, title, checklistItems, relativeTime, footerMeta }) {
  return (
    <div className="relative p-6">
      <div className="absolute inset-y-6 left-0 w-1 rounded-r-full bg-accent" />

      <div className="flex items-start justify-between gap-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,255,255,0.03)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          <FileText className="h-3.5 w-3.5" />
          {label}
        </div>
        <SquareDashed className="mt-1 h-4 w-4 text-obsidian-500" />
      </div>

      <h3 className="mt-6 text-[1.45rem] font-bold leading-tight text-[#fff1d5]">{title}</h3>

      <ul className="mt-6 space-y-3">
        {checklistItems.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm leading-6 text-obsidian-400">
            <SquareCheck className="mt-1 h-4 w-4 shrink-0 text-accent" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-center justify-between border-t border-[rgba(255,204,102,0.08)] pt-4 text-xs text-obsidian-500">
        <span>{relativeTime}</span>
        <span>{footerMeta}</span>
      </div>
    </div>
  );
}

function CollectionCard({ label, title, description, previewSource, tags, relativeTime }) {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between gap-4 text-[11px] font-bold uppercase tracking-[0.18em] text-obsidian-500">
        <span className="inline-flex items-center gap-2">
          <Layers3 className="h-3.5 w-3.5 text-accent" />
          Collection
        </span>
        <span>{label}</span>
      </div>

      <div className="mt-4 grid grid-cols-[1.3fr_0.8fr] gap-2">
        <div className="overflow-hidden rounded-3xl border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)]">
          {previewSource ? (
            <img src={previewSource} alt={title} className="h-40 w-full object-cover" loading="lazy" />
          ) : (
            <div className="h-40 w-full bg-[radial-gradient(circle_at_top,_rgba(248,174,29,0.18),_transparent_45%)]" />
          )}
        </div>
        <div className="grid gap-2">
          <div className="rounded-3xl border border-[rgba(255,204,102,0.08)] bg-[radial-gradient(circle_at_top,_rgba(248,174,29,0.12),_transparent_46%)]" />
          <div className="rounded-3xl border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)]" />
        </div>
      </div>

      <h3 className="mt-5 text-[1.45rem] font-bold leading-tight text-[#fff1d5]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-obsidian-400">
        {description || 'A grouped visual reference from your archive.'}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <TagChip key={tag} label={tag} tone="muted" />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[rgba(255,204,102,0.08)] pt-4 text-xs text-obsidian-500">
        <span>{Math.max(tags.length, 2)} assets</span>
        <span>{relativeTime}</span>
      </div>
    </div>
  );
}

export default ContentCard;
