import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ExternalLink, FileText, ImageIcon, PlayCircle } from 'lucide-react';
import { getFallbackImage, getPreviewImage, getPreviewType } from './utils/contentPreview.utils';

// Reusable preview surface for semantic search results and deep-focus citations.
// Input: content-like object with `type`, `image`, and `url`, plus optional sizing props.
// Output: rich preview that supports images, PDFs, articles, and YouTube embeds.
const ContentPreview = ({
  content,
  className = '',
  compact = false,
  showOpenHint = true,
}) => {
  const previewType = getPreviewType(content);
  const destinationUrl = String(content?.url || '').trim();
  const initialPreview = useMemo(() => getPreviewImage(content), [content]);
  const fallbackPreview = useMemo(() => getFallbackImage(previewType), [previewType]);
  const [previewSource, setPreviewSource] = useState(initialPreview);

  React.useEffect(() => {
    setPreviewSource(initialPreview);
  }, [initialPreview]);

  if (previewType === 'youtube') {
    const embedUrl = buildYouTubeEmbedUrl(destinationUrl);

    if (embedUrl) {
      return (
        <div className={clsx('relative overflow-hidden rounded-[24px] border border-[rgba(255,204,102,0.08)] bg-[rgba(16,12,10,0.82)]', className)}>
          <iframe
            src={embedUrl}
            title={String(content?.title || 'YouTube content')}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className={clsx('w-full border-0', compact ? 'h-40' : 'h-56')}
          />
          {showOpenHint ? <PreviewHint icon={PlayCircle} label="Watch video" href={destinationUrl} /> : null}
        </div>
      );
    }
  }

  return (
    <div className={clsx('relative overflow-hidden rounded-[24px] border border-[rgba(255,204,102,0.08)] bg-[rgba(16,12,10,0.82)]', className)}>
      <img
        src={previewSource}
        alt={String(content?.title || 'Content preview')}
        loading="lazy"
        onError={() => {
          if (previewSource !== fallbackPreview) {
            setPreviewSource(fallbackPreview);
          }
        }}
        className={clsx('w-full object-cover', compact ? 'h-40' : 'h-56')}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(12,9,8,0.7)] via-[rgba(12,9,8,0.18)] to-transparent" />

      {previewType === 'pdf' && showOpenHint ? (
        <PreviewHint icon={FileText} label="Open PDF" href={destinationUrl} />
      ) : null}

      {previewType !== 'pdf' && previewType !== 'youtube' && showOpenHint && destinationUrl ? (
        <PreviewHint
          icon={previewType === 'image' ? ImageIcon : ExternalLink}
          label={previewType === 'image' ? 'Open image' : 'Open source'}
          href={destinationUrl}
        />
      ) : null}
    </div>
  );
};

function PreviewHint({ icon, label, href }) {
  if (!href) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full border border-[rgba(255,241,214,0.14)] bg-[rgba(12,9,8,0.66)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#fff3db] backdrop-blur-xl transition-colors hover:border-[rgba(255,191,64,0.22)] hover:text-accent"
    >
      {React.createElement(icon, { className: 'h-3.5 w-3.5' })}
      {label}
    </a>
  );
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

export default ContentPreview;
