import React, { useEffect, useState } from 'react';
import TagBadge from '../ui/TagBadge';
import { ExternalLink, FileText, ImageOff, Trash2 } from 'lucide-react';
import { useDeleteContent } from '../../hooks/useContent';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const ContentCard = ({ content }) => {
  const { _id, title, description, image, url, tags, type, siteName, createdAt } = content;
  const { deleteContent, loading } = useDeleteContent();
  const [imageFailed, setImageFailed] = useState(false);
  const normalizedType = String(type || '').toLowerCase();
  const destinationUrl = String(url || image || '').trim();
  const isPdfContent = normalizedType === 'pdf' || isPdfUrl(destinationUrl);
  const isDocumentContent = normalizedType === 'document' || isPdfContent;
  const isUploadedImage = normalizedType === 'image';
  const platformLabel = getPlatformLabel(url, type, siteName);
  const displayTitle = getDisplayTitle(url, title, description, type);
  const displayTags = getDisplayTags(tags);
  const previewLabel = getPreviewLabel(platformLabel, type);
  const previewImage = isUploadedImage
    ? String(image || url || '').trim()
    : getPreviewImageUrl(image, url);

  useEffect(() => {
    setImageFailed(false);
  }, [previewImage]);

  const handleDelete = async (e) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to delete this content?')) {
      await deleteContent(_id);
    }
  };

  const showImage = !isDocumentContent && Boolean(previewImage) && !imageFailed;

  return (
    <div className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:-translate-y-1">
      {/* Image section */}
      {isPdfContent ? (
        <div className="aspect-video w-full overflow-hidden bg-slate-100 relative">
          {destinationUrl ? (
            <iframe
              src={getPdfPreviewUrl(destinationUrl)}
              title={displayTitle}
              className="h-full w-full border-0 bg-white"
              loading="lazy"
            />
          ) : null}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/55 via-slate-900/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 shadow-sm">
                <FileText className="w-3.5 h-3.5" />
                PDF
              </span>
              <p className="mt-3 text-sm font-medium text-white line-clamp-2">
                Open the document to read the full file.
              </p>
            </div>
          </div>
        </div>
      ) : isDocumentContent ? (
        <div className="aspect-video w-full relative overflow-hidden bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.7),_transparent_45%)]" />
          <div className="absolute inset-0 flex flex-col justify-between p-5">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 shadow-sm">
              <FileText className="w-3.5 h-3.5" />
              Document
            </span>
            <div>
              <p className="max-w-[16rem] text-base font-semibold text-slate-700 line-clamp-2">
                Uploaded document ready to open.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Use the open action below to view the original file.
              </p>
            </div>
          </div>
        </div>
      ) : showImage ? (
        <a href={destinationUrl} target="_blank" rel="noopener noreferrer" className="aspect-video w-full overflow-hidden bg-slate-100 relative block">
          <img
            src={previewImage}
            alt={displayTitle}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        </a>
      ) : (
        <a
          href={destinationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="aspect-video w-full relative block overflow-hidden bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.7),_transparent_45%)]" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm">
              <ImageOff className="w-3.5 h-3.5" />
              {previewLabel}
            </span>
            <p className="mt-3 max-w-[16rem] text-sm font-medium text-slate-700 line-clamp-2">
              Preview unavailable for this link.
            </p>
          </div>
        </a>
      )}


      {/* Content section */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex gap-2 flex-wrap mb-4">
          {platformLabel && <TagBadge label={platformLabel} />}
          {siteName && siteName.toLowerCase() !== platformLabel && (
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider my-auto">{siteName}</span>
          )}
        </div>

        <a href={destinationUrl} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-slate-800 leading-snug mb-2 line-clamp-2 hover:text-primary transition-colors" title={displayTitle}>
          {displayTitle}
        </a>

        {description && (
          <p className="text-sm text-slate-500 line-clamp-2 mb-4">
            {description}
          </p>
        )}

        {/* Tags */}
        {displayTags.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4 mt-auto">
            {displayTags.map((tag, idx) => (
              <span key={idx} className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">#{tag}</span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            {createdAt ? new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown Date'}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              title="Delete content"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <a
              href={destinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-dark p-2 hover:bg-slate-50 rounded-full transition-colors"
              title="Open original"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

function getPlatformLabel(url, type, siteName) {
  const normalizedUrl = String(url || '').toLowerCase();
  const normalizedType = String(type || '').toLowerCase();
  const normalizedSiteName = String(siteName || '').toLowerCase();

  if (normalizedType === 'image') {
    return 'image';
  }

  if (normalizedType === 'document') {
    return isPdfUrl(normalizedUrl) ? 'pdf' : 'document';
  }

  if (normalizedType === 'pdf') {
    return 'pdf';
  }

  if (normalizedUrl.includes('linkedin.com') || normalizedSiteName.includes('linkedin')) {
    return 'linkedin';
  }

  if (normalizedUrl.includes('instagram.com') || normalizedSiteName.includes('instagram')) {
    return 'instagram';
  }

  if (normalizedUrl.includes('youtube.com') || normalizedUrl.includes('youtu.be')) {
    return 'youtube';
  }

  if (normalizedUrl.includes('twitter.com') || normalizedUrl.includes('x.com')) {
    return type === 'tweet' ? 'tweet' : 'twitter';
  }

  return normalizedType || siteName || 'web';
}

function getDisplayTitle(url, title, description, type) {
  const normalizedUrl = String(url || '').toLowerCase();
  const trimmedTitle = String(title || '').trim();

  if ((normalizedUrl.includes('twitter.com') || normalizedUrl.includes('x.com')) && isStatusId(trimmedTitle)) {
    const username = extractTwitterUsername(url);
    return username ? `Tweet by @${username}` : 'Tweet';
  }

  if (normalizedUrl.includes('linkedin.com') && trimmedTitle.startsWith('#')) {
    const fallbackLine = String(description || '')
      .split('\n')
      .map(line => line.trim())
      .find(Boolean);

    if (fallbackLine) {
      return fallbackLine;
    }
  }

  if (trimmedTitle) {
    return trimmedTitle;
  }

  if (String(type || '').toLowerCase() === 'image') {
    return 'Uploaded image';
  }

  if (String(type || '').toLowerCase() === 'document' || isPdfUrl(normalizedUrl)) {
    return 'Uploaded document';
  }

  return 'Untitled';
}

function getDisplayTags(tags) {
  const normalizedTags = (tags || [])
    .map(tag => String(tag || '').toLowerCase().replace(/^#+/, '').replace(/[^a-z0-9]+/g, '').trim())
    .filter(tag => tag.length > 1 && !isStatusId(tag));

  return Array.from(new Set(normalizedTags)).slice(0, 6);
}

function getPreviewLabel(platformLabel, type) {
  const label = String(platformLabel || type || 'web').trim();
  return label || 'web';
}

function getPreviewImageUrl(imageUrl, sourceUrl) {
  const normalizedImageUrl = String(imageUrl || '').trim();

  if (!normalizedImageUrl) {
    return '';
  }

  if (normalizedImageUrl.includes('/content/image-proxy?')) {
    return normalizedImageUrl;
  }

  if (!/^https?:\/\//i.test(normalizedImageUrl)) {
    return normalizedImageUrl;
  }

  // Route third-party previews through the backend because sites like LinkedIn often block direct <img> embedding.
  const normalizedApiUrl = API_URL.replace(/\/+$/, '');
  const params = new URLSearchParams({
    url: normalizedImageUrl,
  });

  if (sourceUrl) {
    params.set('source', sourceUrl);
  }

  return `${normalizedApiUrl}/content/image-proxy?${params.toString()}`;
}

function getPdfPreviewUrl(url) {
  const normalizedUrl = String(url || '').trim();

  if (!normalizedUrl) {
    return '';
  }

  return `${normalizedUrl}#toolbar=0&navpanes=0&scrollbar=0`;
}

function extractTwitterUsername(url) {
  try {
    const segments = new URL(url).pathname.split('/').filter(Boolean);
    const username = segments.find(segment => segment && segment.toLowerCase() !== 'status');

    if (username && username.toLowerCase() !== 'i' && username.toLowerCase() !== 'web') {
      return username;
    }
  } catch {
    return '';
  }

  return '';
}

function isStatusId(value) {
  return /^\d{8,}$/.test(String(value || '').trim());
}

function isPdfUrl(url) {
  return /\.pdf(?:$|[?#])/i.test(String(url || '').trim());
}

export default ContentCard;
