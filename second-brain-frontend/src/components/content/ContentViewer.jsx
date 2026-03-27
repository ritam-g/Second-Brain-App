import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Clock3,
  ExternalLink,
  FileText,
  Globe2,
  ImageIcon,
  PlayCircle,
  Tag,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import TagChip from './TagChip';
import {
  getContentKind,
  getDestinationUrl,
  getDisplayDescription,
  getDisplayTags,
  getDisplayTitle,
  getFallbackImage,
  getPreviewSource,
  getPreviewType,
  getSavedTimeLabel,
  getSourceLabel,
  getTypeBadge,
} from './utils';

const MAX_VIEWER_TITLE_CHARS = 120;
const MAX_VIEWER_DESCRIPTION_CHARS = 360;
const viewerBackdropTransition = { duration: 0.18, ease: 'easeOut' };
const viewerPanelTransition = { duration: 0.24, ease: [0.22, 1, 0.36, 1] };

const ContentViewer = ({ content, isOpen, onClose }) => {
  const previewType = useMemo(() => getPreviewType(content), [content]);
  const contentKind = useMemo(() => getContentKind(content), [content]);
  const destinationUrl = useMemo(() => getDestinationUrl(content), [content]);
  const sourceLabel = useMemo(() => getSourceLabel(content), [content]);
  const typeBadge = useMemo(() => getTypeBadge(content), [content]);
  const tags = useMemo(() => getDisplayTags(content, 6), [content]);
  const savedLabel = useMemo(() => getSavedTimeLabel(content), [content]);
  const title = useMemo(() => getViewerTitle(content), [content]);
  const description = useMemo(() => getViewerDescription(content, title), [content, title]);
  const initialPreviewSource = useMemo(() => getPreviewSource(content), [content]);
  const fallbackPreviewSource = useMemo(() => getFallbackImage(previewType), [previewType]);
  const videoEmbedUrl = useMemo(() => buildYouTubeEmbedUrl(destinationUrl), [destinationUrl]);
  const canOpenOriginal = Boolean(destinationUrl && destinationUrl !== '#');
  const canZoomImage = contentKind === 'image' || previewType === 'image';
  const [previewSource, setPreviewSource] = useState(initialPreviewSource);
  const [hasMediaFailure, setHasMediaFailure] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const MotionButton = motion.button;

  useEffect(() => {
    setPreviewSource(initialPreviewSource);
    setHasMediaFailure(false);
    setIsImageZoomed(false);
  }, [initialPreviewSource, isOpen, content?._id, content?.deleteId, content?.url]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && content ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={viewerBackdropTransition}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(3,2,2,0.72)] p-3 backdrop-blur-sm sm:p-5"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.985 }}
            transition={viewerPanelTransition}
            className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-[rgba(255,204,102,0.08)] bg-[rgba(17,13,11,0.97)] shadow-[0_36px_120px_rgba(0,0,0,0.52)] sm:max-h-[calc(100vh-2.5rem)]"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4 border-b border-[rgba(255,204,102,0.08)] px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-[rgba(255,204,102,0.1)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-accent-soft">
                    {sourceLabel}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-[rgba(255,204,102,0.1)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#fff0d0]">
                    {typeBadge}
                  </span>
                </div>

                <h2 className="mt-3 max-w-3xl text-xl font-bold leading-tight text-[#fff2d7] sm:text-2xl">
                  {title}
                </h2>
              </div>

              <MotionButton
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[rgba(255,204,102,0.08)] bg-[rgba(26,20,17,0.95)] text-obsidian-300 transition-colors hover:border-[rgba(255,191,64,0.18)] hover:text-[#fff2d7]"
                onClick={onClose}
                aria-label="Close content viewer"
              >
                <X className="h-5 w-5" />
              </MotionButton>
            </header>

            <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.7fr)]">
              <section className="obsidian-scroll min-h-0 overflow-y-auto border-b border-[rgba(255,204,102,0.08)] px-4 py-4 sm:px-6 sm:py-6 lg:border-b-0 lg:border-r">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-obsidian-500">
                    Inline Preview
                  </p>

                  {canZoomImage ? (
                    <button
                      type="button"
                      onClick={() => setIsImageZoomed((previous) => !previous)}
                      className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-obsidian-300 transition-colors hover:border-[rgba(255,191,64,0.18)] hover:text-[#fff2d7]"
                    >
                      {isImageZoomed ? <ZoomOut className="h-3.5 w-3.5" /> : <ZoomIn className="h-3.5 w-3.5" />}
                      {isImageZoomed ? 'Reset View' : 'Zoom Image'}
                    </button>
                  ) : null}
                </div>

                <ViewerMedia
                  previewType={previewType}
                  contentKind={contentKind}
                  title={title}
                  sourceLabel={sourceLabel}
                  destinationUrl={destinationUrl}
                  videoEmbedUrl={videoEmbedUrl}
                  previewSource={previewSource}
                  hasMediaFailure={hasMediaFailure}
                  isImageZoomed={isImageZoomed}
                  onMediaError={() => {
                    if (previewSource !== fallbackPreviewSource) {
                      setPreviewSource(fallbackPreviewSource);
                      return;
                    }

                    setHasMediaFailure(true);
                  }}
                  onToggleImageZoom={() => setIsImageZoomed((previous) => !previous)}
                />
              </section>

              <aside className="obsidian-scroll min-h-0 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
                <div className="rounded-[26px] border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.02)] p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-obsidian-500">
                    Summary
                  </p>
                  <p className="mt-3 text-sm leading-7 text-obsidian-300">
                    {description}
                  </p>
                </div>

                <div className="mt-5 grid gap-3">
                  <MetaItem
                    icon={Globe2}
                    label="Source"
                    value={sourceLabel}
                  />
                  <MetaItem
                    icon={Clock3}
                    label="Saved"
                    value={savedLabel}
                  />
                  <MetaItem
                    icon={previewType === 'youtube' ? PlayCircle : previewType === 'pdf' ? FileText : ImageIcon}
                    label="Viewer Mode"
                    value={getViewerModeLabel(previewType, contentKind)}
                  />
                </div>

                {tags.length ? (
                  <div className="mt-6">
                    <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-obsidian-500">
                      <Tag className="h-3.5 w-3.5" />
                      Tags
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <TagChip key={tag} label={tag} tone="accent" />
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-6 space-y-3">
                  {canOpenOriginal ? (
                    <a
                      href={destinationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(255,204,102,0.08)] bg-[rgba(28,22,18,0.92)] px-4 py-3 text-sm font-semibold text-obsidian-300 transition-colors hover:border-[rgba(255,191,64,0.18)] hover:bg-[rgba(35,27,22,0.98)] hover:text-[#fff2d7]"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Original
                    </a>
                  ) : null}

                  <div className="rounded-[22px] border border-[rgba(255,204,102,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm leading-6 text-obsidian-400">
                    {getViewerSupportNote(previewType, Boolean(videoEmbedUrl), canOpenOriginal)}
                  </div>
                </div>
              </aside>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
};

function ViewerMedia({
  previewType,
  contentKind,
  title,
  sourceLabel,
  destinationUrl,
  videoEmbedUrl,
  previewSource,
  hasMediaFailure,
  isImageZoomed,
  onMediaError,
  onToggleImageZoom,
}) {
  if (previewType === 'youtube') {
    if (!videoEmbedUrl) {
      return (
        <MediaFallback
          icon={PlayCircle}
          title="This video could not be embedded."
          description="The saved YouTube link is still available, but the inline player could not be prepared."
        />
      );
    }

    return (
      <div className="overflow-hidden rounded-[28px] border border-[rgba(255,204,102,0.08)] bg-[rgba(8,7,7,0.92)] shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
        <iframe
          src={videoEmbedUrl}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full border-0"
        />
      </div>
    );
  }

  if (previewType === 'pdf') {
    if (!destinationUrl || destinationUrl === '#') {
      return (
        <MediaFallback
          icon={FileText}
          title="This document preview is unavailable."
          description="The file URL is missing, so the PDF cannot be shown inline yet."
        />
      );
    }

    return (
      <div className="overflow-hidden rounded-[28px] border border-[rgba(255,204,102,0.08)] bg-[rgba(8,7,7,0.92)] shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
        <iframe
          src={destinationUrl}
          title={`${title} PDF preview`}
          loading="lazy"
          className="h-[72vh] min-h-[420px] w-full border-0"
        />
      </div>
    );
  }

  if (contentKind === 'image' || previewType === 'image') {
    if (hasMediaFailure) {
      return (
        <MediaFallback
          icon={ImageIcon}
          title="This image preview is unavailable."
          description="The saved image could not be rendered, so only the archive details are available right now."
        />
      );
    }

    return (
      <div className="overflow-hidden rounded-[28px] border border-[rgba(255,204,102,0.08)] bg-[radial-gradient(circle_at_top,_rgba(255,204,102,0.1),_transparent_36%),rgba(8,7,7,0.92)] shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
        <div className="max-h-[72vh] overflow-auto px-4 py-4 sm:px-6 sm:py-6">
          <img
            src={previewSource}
            alt={title}
            loading="lazy"
            onError={onMediaError}
            onClick={onToggleImageZoom}
            className={clsx(
              'mx-auto max-h-[68vh] w-auto max-w-full rounded-[24px] object-contain transition-transform duration-300',
              isImageZoomed ? 'scale-[1.6] cursor-zoom-out' : 'cursor-zoom-in',
            )}
          />
        </div>
      </div>
    );
  }

  if (hasMediaFailure) {
    return (
      <MediaFallback
        icon={Globe2}
        title="This saved link has a limited preview."
        description="Inline rendering is unavailable for this item, but its title, summary, and source details are still preserved."
      />
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-[rgba(255,204,102,0.08)] bg-[rgba(8,7,7,0.92)] shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <img
        src={previewSource}
        alt={title}
        loading="lazy"
        onError={onMediaError}
        className="h-[340px] w-full object-cover sm:h-[440px] lg:h-[560px]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(9,7,6,0.88)] via-[rgba(9,7,6,0.18)] to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f2d6a7]/80">
          {sourceLabel}
        </p>
        <h3 className="mt-3 max-w-3xl text-2xl font-bold leading-tight text-[#fff3db] sm:text-[2rem]">
          {title}
        </h3>
      </div>
    </div>
  );
}

function MediaFallback({ icon, title, description }) {
  return (
    <div className="flex min-h-[340px] items-center justify-center rounded-[28px] border border-[rgba(255,204,102,0.08)] bg-[linear-gradient(135deg,rgba(72,48,28,0.92),rgba(18,14,12,0.98))] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.28)] sm:min-h-[440px]">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-[rgba(255,204,102,0.14)] bg-[rgba(255,255,255,0.04)] text-accent">
          {React.createElement(icon, { className: 'h-7 w-7' })}
        </div>
        <h3 className="mt-5 text-2xl font-bold text-[#fff2d7]">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-7 text-obsidian-300">
          {description}
        </p>
      </div>
    </div>
  );
}

function MetaItem({ icon, label, value }) {
  return (
    <div className="rounded-[22px] border border-[rgba(255,204,102,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-obsidian-500">
        {React.createElement(icon, { className: 'h-3.5 w-3.5' })}
        {label}
      </div>
      <p className="mt-2 text-sm text-obsidian-300">
        {value}
      </p>
    </div>
  );
}

function getViewerTitle(content) {
  const rawTitle = String(content?.title || content?.metadata?.title || '').trim();

  if (rawTitle) {
    return clampText(rawTitle, MAX_VIEWER_TITLE_CHARS);
  }

  return getDisplayTitle(content);
}

function getViewerDescription(content, title) {
  const rawDescription = String(
    content?.matchedChunkText
    || content?.description
    || content?.summary
    || content?.metadata?.description
    || '',
  );
  const cleanedDescription = normalizeDescription(rawDescription, title);

  if (cleanedDescription) {
    return clampText(cleanedDescription, MAX_VIEWER_DESCRIPTION_CHARS);
  }

  const fallbackDescription = getDisplayDescription(content);

  if (fallbackDescription && fallbackDescription !== 'No description available') {
    return fallbackDescription;
  }

  return 'No description available for this saved item yet.';
}

function normalizeDescription(value, title = '') {
  const normalizedTitle = String(title || '').trim().toLowerCase();
  const cleanedValue = String(value || '')
    .replace(/\r/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\bhttps?:\/\/\S+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanedValue) {
    return '';
  }

  if (normalizedTitle && cleanedValue.toLowerCase().startsWith(normalizedTitle)) {
    return cleanedValue.slice(title.length).replace(/^(\s|:|-|\|)+/, '').trim();
  }

  return cleanedValue;
}

function clampText(value, maxLength) {
  const normalizedValue = String(value || '').trim();

  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function getViewerModeLabel(previewType, contentKind) {
  if (previewType === 'youtube') {
    return 'Embedded YouTube player';
  }

  if (previewType === 'pdf') {
    return 'Inline document preview';
  }

  if (contentKind === 'image' || previewType === 'image') {
    return 'Responsive image viewer';
  }

  return 'Inline article preview';
}

function getViewerSupportNote(previewType, hasVideoEmbed, canOpenOriginal) {
  if (previewType === 'youtube' && !hasVideoEmbed) {
    return canOpenOriginal
      ? 'This YouTube URL could not be embedded, so the original link is available as a fallback.'
      : 'This YouTube URL could not be embedded, and no original fallback link is available.';
  }

  if (previewType === 'pdf') {
    return canOpenOriginal
      ? 'If the document viewer is blocked by the browser, use Open Original to view the source file directly.'
      : 'This document is shown inline whenever the source file is still available.';
  }

  if (previewType === 'image') {
    return canOpenOriginal
      ? 'Tap the image to zoom in, and use Open Original only when you want the source outside the app.'
      : 'Tap the image to zoom in and inspect it without leaving the app.';
  }

  return canOpenOriginal
    ? 'This item stays readable inside your workspace. Open Original remains available only as a fallback action.'
    : 'This item is being rendered with the metadata available in your archive.';
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

export default ContentViewer;
