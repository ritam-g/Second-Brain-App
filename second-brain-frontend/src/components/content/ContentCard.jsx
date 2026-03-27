import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  AtSign,
  Clock3,
  FileText,
  Globe2,
  ImageIcon,
  Layers3,
  PlayCircle,
  SquareCheck,
} from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import TagChip from './TagChip';
import CardOverlayActions from './CardOverlayActions';
import {
  getCardLabel,
  getCardVariant,
  getContentKind,
  getDescriptionLabel,
  getDestinationUrl,
  getDisplayDescription,
  getDisplayTags,
  getDisplayTitle,
  getDocumentChecklist,
  getFooterMeta,
  getTypeBadge,
  getPreviewSource,
  getRelativeTime,
  getSourceLabel,
  getPreviewType,
  getFallbackImage,
} from './utils';
import { useDeleteContent } from '../../hooks/useContent';
import { useContentViewerActions } from '../../hooks/useContentViewer';

/**
 * ContentCard Component
 * Responsibility: renders one saved content item in the shared dashboard card format.
 * Handles: preview fallbacks, metadata presentation, and delete/open actions.
 */
const ContentCard = ({ content, index }) => {
  const { deleteContent, loading } = useDeleteContent();
  const { openViewer } = useContentViewerActions();
  const deleteId = content?.deleteId || content?.contentId || content?._id;
  const variant = getCardVariant(content, index);
  const kind = getContentKind(content);
  const previewType = getPreviewType(content);
  const basePreviewSource = getPreviewSource(content);
  const destinationUrl = getDestinationUrl(content);
  const displayTitle = getDisplayTitle(content);
  const displayDescription = getDisplayDescription(content);
  const descriptionLabel = getDescriptionLabel(content);
  const displayTags = getDisplayTags(content);
  const cardLabel = getCardLabel(content);
  const typeBadge = getTypeBadge(content);
  const relativeTime = getRelativeTime(content);
  const footerMeta = getFooterMeta(content);
  const sourceLabel = getSourceLabel(content);
  const checklistItems = useMemo(() => getDocumentChecklist(content), [content]);
  const fallbackPreviewSource = useMemo(() => getFallbackImage(previewType), [previewType]);
  const [previewSource, setPreviewSource] = useState(basePreviewSource);
  const [previewLoaded, setPreviewLoaded] = useState(previewLoadsInstantly(basePreviewSource));

  useEffect(() => {
    setPreviewSource(basePreviewSource);
    setPreviewLoaded(previewLoadsInstantly(basePreviewSource));
  }, [basePreviewSource]);

  const handleDelete = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!deleteId) {
      return;
    }

    if (window.confirm('Delete this archive entry?')) {
      await deleteContent(deleteId);
    }
  };

  const handleOpenViewer = (event) => {
    event.preventDefault();
    openViewer(content);
  };

  // Fall back to generated artwork so broken external previews do not collapse card layout.
  const handlePreviewError = () => {
    if (previewSource !== fallbackPreviewSource) {
      setPreviewSource(fallbackPreviewSource);
      setPreviewLoaded(false);
      return;
    }

    setPreviewLoaded(true);
  };

  return (
    <GlassCard
      interactive
      className="content-card debug-content-card group relative overflow-hidden"
      data-debug="content-card"
      data-id={content?._id || ''}
      data-type={content?.type || previewType || 'unknown'}
      data-description-language={content?.descriptionLanguage || ''}
      data-variant={variant}
      data-preview-type={previewType}
    >
      <button
        type="button"
        aria-label={`Open ${displayTitle} inside viewer`}
        onClick={handleOpenViewer}
        className="content-card-link debug-content-card-link absolute inset-0 z-10 rounded-[28px] bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        data-debug="content-card-link"
      />

      <CardOverlayActions href={destinationUrl} onDelete={handleDelete} loading={loading} />

      <CardPreview
        previewType={previewType}
        previewSource={previewSource}
        destinationUrl={destinationUrl}
        title={displayTitle}
        label={cardLabel}
        sourceLabel={sourceLabel}
        variant={variant}
        loaded={previewLoaded}
        onLoad={() => setPreviewLoaded(true)}
        onError={handlePreviewError}
      />

      <div className="content-card-body debug-content-card-body p-5" data-debug="content-card-body">
        <div className="content-card-meta debug-content-card-meta flex items-center justify-between gap-3" data-debug="content-card-meta">
          <p className="content-card-source debug-content-card-source min-w-0 truncate text-[11px] uppercase tracking-[0.18em] text-obsidian-500">{sourceLabel}</p>
          <div className="flex items-center gap-2">
            <span className="content-card-type debug-content-card-type inline-flex items-center rounded-full border border-[rgba(255,204,102,0.12)] bg-[rgba(255,255,255,0.03)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-accent-soft">
              {typeBadge}
            </span>
            <span className="content-card-label debug-content-card-label max-w-[42%] truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-obsidian-500">
              {variant === 'collection' ? 'Visual Set' : cardLabel}
            </span>
          </div>
        </div>

        <h3
          className="content-title debug-content-title mt-3 text-[1.45rem] font-bold leading-tight text-[#fff1d5]"
          data-debug="content-title"
          style={getLineClampStyle(2)}
        >
          {displayTitle}
        </h3>

        <p
          className="content-description-label debug-content-description-label mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-obsidian-500"
          data-debug="content-description-label"
        >
          {descriptionLabel}
        </p>

        <p
          className="content-description debug-content-description mt-2 break-words text-sm leading-7 text-obsidian-400"
          data-debug="content-description"
          style={getLineClampStyle(3)}
          title={displayDescription}
        >
          {displayDescription}
        </p>

        {kind === 'document' ? (
          <DocumentChecklist items={checklistItems} />
        ) : null}

        {displayTags.length ? (
          <div className="content-tags debug-content-tags mt-5 flex flex-wrap gap-2" data-debug="content-tags">
            {displayTags.map((tag) => (
              <TagChip key={tag} label={tag} tone="muted" className="max-w-[132px] truncate" />
            ))}
          </div>
        ) : null}

        <div className="content-footer debug-content-footer mt-6 flex items-center justify-between border-t border-[rgba(255,204,102,0.08)] pt-4 text-xs text-obsidian-500" data-debug="content-footer">
          <span className="inline-flex items-center gap-2">
            <Clock3 className="h-3.5 w-3.5" />
            Saved {relativeTime}
          </span>
          <span>{footerMeta}</span>
        </div>
      </div>
    </GlassCard>
  );
};

/**
 * CardPreview Component
 * Responsibility: keeps preview rendering consistent across image, video, and document content types.
 */
function CardPreview({
  previewType,
  previewSource,
  destinationUrl,
  title,
  label,
  sourceLabel,
  variant,
  loaded,
  onLoad,
  onError,
}) {
  if (previewType === 'pdf' && isGeneratedPreview(previewSource)) {
    return (
      <PdfPreview
        title={title}
        label={label}
        sourceLabel={sourceLabel}
      />
    );
  }

  const youtubeEmbedUrl = previewType === 'youtube' ? buildYouTubeEmbedUrl(destinationUrl) : '';

  if (youtubeEmbedUrl) {
    return (
      <div
        className="content-card-preview content-card-preview-video debug-content-card-preview relative h-[220px] overflow-hidden border-b border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)]"
        data-debug="content-card-preview"
        data-preview-type={previewType}
      >
        <iframe
          src={youtubeEmbedUrl}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(12,9,8,0.82)] via-[rgba(12,9,8,0.14)] to-transparent" />
        <PreviewBadge label={label} />

        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
          <div className="min-w-0 max-w-[78%]">
            <p className="truncate text-[10px] uppercase tracking-[0.24em] text-[#f2d6a7]/80">{sourceLabel}</p>
            <h3 className="mt-2 text-xl font-bold leading-tight text-[#fff3db]" style={getLineClampStyle(2)}>{title}</h3>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[rgba(255,241,214,0.14)] bg-[rgba(12,9,8,0.58)] text-[#fff3db] backdrop-blur-xl">
            <PlayCircle className="h-5 w-5" />
          </div>
        </div>
      </div>
    );
  }

  const AccentIcon = getPreviewAccentIcon(previewType, variant);
  const previewAlt = previewType === 'pdf' ? `${title} PDF preview` : title;

  return (
    <div
      className="content-card-preview debug-content-card-preview relative h-[220px] overflow-hidden border-b border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)]"
      data-debug="content-card-preview"
      data-preview-type={previewType}
    >
      {!loaded ? (
        <div className="absolute inset-0 animate-pulse bg-[linear-gradient(120deg,rgba(255,255,255,0.03),rgba(255,255,255,0.08),rgba(255,255,255,0.03))]" />
      ) : null}

      <img
        src={previewSource}
        alt={previewAlt}
        loading="lazy"
        onLoad={onLoad}
        onError={onError}
        className={clsx(
          'h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.05]',
          loaded ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(12,9,8,0.9)] via-[rgba(12,9,8,0.18)] to-transparent" />
      <PreviewBadge label={label} />

      {previewType === 'pdf' ? (
        <div className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full border border-[rgba(255,241,214,0.14)] bg-[rgba(12,9,8,0.64)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#fff3db] backdrop-blur-xl">
          <FileText className="h-3.5 w-3.5 text-accent" />
          Open PDF
        </div>
      ) : null}

      <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
        <div className="min-w-0 max-w-[78%]">
          <p className="truncate text-[10px] uppercase tracking-[0.24em] text-[#f2d6a7]/80">{sourceLabel}</p>
          <h3 className="mt-2 text-xl font-bold leading-tight text-[#fff3db]" style={getLineClampStyle(2)}>{title}</h3>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[rgba(255,241,214,0.14)] bg-[rgba(12,9,8,0.58)] text-[#fff3db] backdrop-blur-xl">
          <AccentIcon className="h-5 w-5" />
        </div>
      </div>

      {variant === 'collection' ? (
        <div className="pointer-events-none absolute right-5 top-16 hidden gap-2 md:flex">
          <div className="h-14 w-14 rounded-2xl border border-[rgba(255,241,214,0.14)] bg-[rgba(12,9,8,0.32)] backdrop-blur-sm" />
          <div className="mt-6 h-14 w-14 rounded-2xl border border-[rgba(255,241,214,0.14)] bg-[rgba(12,9,8,0.24)] backdrop-blur-sm" />
        </div>
      ) : null}
    </div>
  );
}

/**
 * PdfPreview Component
 * Responsibility: preserves a branded preview surface when a PDF only has generated artwork.
 */
function PdfPreview({ title, label, sourceLabel }) {
  return (
    <div
      className="content-card-preview content-card-preview-pdf debug-content-card-preview relative h-[220px] overflow-hidden border-b border-[rgba(255,204,102,0.08)] bg-[linear-gradient(135deg,#43240d,#110d0c_42%,#6a3c12_100%)]"
      data-debug="content-card-preview"
      data-preview-type="pdf"
    >
      <div className="absolute -right-12 top-10 h-40 w-40 rounded-full bg-[rgba(248,174,29,0.2)] blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,231,191,0.12),_transparent_36%)]" />
      <PreviewBadge label={label} />

      <div className="absolute right-8 top-8 hidden md:block">
        <div className="relative h-36 w-28 rounded-[1.75rem] border border-[rgba(255,241,214,0.12)] bg-[rgba(255,255,255,0.08)] shadow-[0_20px_35px_rgba(0,0,0,0.18)]" />
        <div className="absolute -left-4 top-5 h-36 w-28 rotate-[-8deg] rounded-[1.75rem] border border-[rgba(255,241,214,0.14)] bg-[rgba(255,255,255,0.12)]" />
      </div>

      <div className="relative flex h-full flex-col justify-end p-5">
        <div className="max-w-[72%]">
          <p className="truncate text-[10px] uppercase tracking-[0.24em] text-[#f2d6a7]/85">{sourceLabel}</p>
          <h3 className="mt-2 text-xl font-bold leading-tight text-[#fff3db]" style={getLineClampStyle(2)}>{title}</h3>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[rgba(255,241,214,0.14)] bg-[rgba(12,9,8,0.34)] px-3 py-1.5 text-xs font-semibold text-[#fff3db]">
            <FileText className="h-3.5 w-3.5 text-accent" />
            Open PDF document
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * PreviewBadge Component
 * Responsibility: exposes a small, stable preview label for quick visual inspection.
 */
function PreviewBadge({ label }) {
  return (
    <div
      className="content-card-badge debug-content-card-badge absolute left-5 top-5 inline-flex max-w-[150px] items-center truncate rounded-full border border-[rgba(255,241,214,0.12)] bg-[rgba(12,9,8,0.6)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent backdrop-blur-xl"
      data-debug="content-card-badge"
    >
      {label}
    </div>
  );
}

/**
 * DocumentChecklist Component
 * Responsibility: shows shortened document takeaways without expanding the full saved description.
 */
function DocumentChecklist({ items }) {
  return (
    <ul className="content-card-checklist debug-content-card-checklist mt-5 space-y-3" data-debug="content-card-checklist">
      {items.map((item) => (
        <li key={item} className="content-card-checklist-item debug-content-card-checklist-item flex items-start gap-3 text-sm leading-6 text-obsidian-400">
          <SquareCheck className="mt-1 h-4 w-4 shrink-0 text-accent" />
          <span style={getLineClampStyle(2)}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function getPreviewAccentIcon(previewType, variant) {
  if (variant === 'collection') {
    return Layers3;
  }

  if (previewType === 'youtube') {
    return PlayCircle;
  }

  if (previewType === 'pdf') {
    return FileText;
  }

  if (previewType === 'image') {
    return ImageIcon;
  }

  if (['instagram', 'linkedin', 'twitter'].includes(previewType)) {
    return AtSign;
  }

  return Globe2;
}

function getLineClampStyle(lines) {
  return {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: lines,
    overflow: 'hidden',
  };
}

function previewLoadsInstantly(source) {
  return isGeneratedPreview(source);
}

function isGeneratedPreview(source) {
  return String(source || '').startsWith('data:image/');
}

function buildYouTubeEmbedUrl(url) {
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return '';
  }

  return `https://www.youtube.com/embed/${videoId}`;
}

function extractYouTubeId(url) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes('youtu.be')) {
      return parsedUrl.pathname.replace('/', '').trim();
    }

    if (parsedUrl.pathname.startsWith('/shorts/')) {
      return parsedUrl.pathname.split('/').filter(Boolean)[1] || '';
    }

    return parsedUrl.searchParams.get('v') || '';
  } catch {
    return '';
  }
}

export default ContentCard;
