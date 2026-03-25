import React, { useEffect, useState } from 'react';
import TagBadge from '../ui/TagBadge';
import { ExternalLink, Bookmark, Trash2 } from 'lucide-react';
import { useDeleteContent } from '../../hooks/useContent';

const ContentCard = ({ content }) => {
  const { _id, title, description, image, url, tags, type, siteName, createdAt } = content;
  const { deleteContent } = useDeleteContent();
  const [imageFailed, setImageFailed] = useState(false);
  const platformLabel = getPlatformLabel(url, type, siteName);
  const displayTitle = getDisplayTitle(url, title, description);
  const displayTags = getDisplayTags(tags);

  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  const handleDelete = async (e) => {
    e.preventDefault();
    if(window.confirm('Are you sure you want to delete this content?')) {
      await deleteContent(_id);
    }
  };

  const showImage = Boolean(image) && !imageFailed;

  return (
    <div className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:-translate-y-1">
      {/* Image section */}
      {showImage ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="aspect-video w-full overflow-hidden bg-slate-100 relative block">
          <img 
            src={image} 
            alt={displayTitle} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        </a>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" className="aspect-video w-full bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 flex items-center justify-center block">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Bookmark className="w-12 h-12 text-slate-300" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">
              {platformLabel || 'Web'}
            </span>
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
