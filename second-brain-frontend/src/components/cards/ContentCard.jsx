import React, { useEffect, useState } from 'react';
import TagBadge from '../ui/TagBadge';
import { ExternalLink, ImageOff, Trash2 } from 'lucide-react';
import { useDeleteContent } from '../../hooks/useContent';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const ContentCard = ({ content }) => {
  const { _id, title, description, image, url, tags, type, siteName, createdAt } = content;
  const { deleteContent } = useDeleteContent();
  const [imageFailed, setImageFailed] = useState(false);
  const platformLabel = getPlatformLabel(url, type, siteName);
  const displayTitle = getDisplayTitle(url, title, description);
  const displayTags = getDisplayTags(tags);
  const previewLabel = getPreviewLabel(platformLabel, type);
  const previewImage = getPreviewImageUrl(image, url);

  useEffect(() => {
    setImageFailed(false);
  }, [previewImage]);

  const handleDelete = async (e) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to delete this content?')) {
      await deleteContent(_id);
    }
  };

  const showImage = Boolean(previewImage) && !imageFailed;

  return (
    <div className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:-translate-y-1">
      {/* Image section */}
      {showImage ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="aspect-video w-full overflow-hidden bg-slate-100 relative block">
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
          href={url}
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

        <a href={url} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-slate-800 leading-snug mb-2 line-clamp-2 hover:text-primary transition-colors" title={displayTitle}>
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
              className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
              title="Delete content"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <a
              href={url}
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
  const normalizedSiteName = String(siteName || '').toLowerCase();

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

  return type || siteName || 'web';
}

function getDisplayTitle(url, title, description) {
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

  return trimmedTitle || 'Untitled';
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

export default ContentCard;
