import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const genericTags = new Set(['upload', 'image', 'pdf', 'document', 'article', 'link', 'social', 'video']);

// Maps backend content into the dashboard's high-level visual categories.
// Input: saved content item from Redux.
// Output: normalized kind string used by the card renderer.
export function getContentKind(content) {
  const normalizedType = String(content?.type || '').toLowerCase();
  const normalizedUrl = String(content?.url || '').toLowerCase();

  if (normalizedType === 'image') {
    return 'image';
  }

  if (normalizedType === 'pdf' || normalizedType === 'document' || isPdfUrl(normalizedUrl)) {
    return 'document';
  }

  if (normalizedType === 'youtube' || normalizedUrl.includes('youtube.com') || normalizedUrl.includes('youtu.be')) {
    return 'video';
  }

  if (
    ['tweet', 'x', 'linkedin', 'instagram'].includes(normalizedType)
    || normalizedUrl.includes('twitter.com')
    || normalizedUrl.includes('x.com')
    || normalizedUrl.includes('linkedin.com')
    || normalizedUrl.includes('instagram.com')
  ) {
    return 'social';
  }

  return 'article';
}

// Chooses a visual card layout so the masonry grid gets the same varied feel as the reference UI.
// Input: content item and list index.
// Output: card variant string used by the ContentCard component.
export function getCardVariant(content, index = 0) {
  const kind = getContentKind(content);
  const hasPreview = Boolean(getPreviewSource(content));

  if (kind === 'social') {
    return 'quote';
  }

  if (kind === 'document') {
    return 'document';
  }

  if (kind === 'image' && index % 5 === 0) {
    return 'collection';
  }

  if (kind === 'image' || kind === 'video' || hasPreview) {
    return 'media';
  }

  return 'article';
}

// Resolves the primary outbound URL for the card.
// Input: content item.
// Output: absolute URL string or '#'.
export function getDestinationUrl(content) {
  const destination = String(content?.url || content?.image || '').trim();
  return destination || '#';
}

// Resolves the preview asset for image-heavy cards, routing third-party images through the backend proxy when needed.
// Input: content item from Redux.
// Output: preview image URL string or an empty string.
export function getPreviewSource(content) {
  const kind = getContentKind(content);
  const normalizedImage = String(content?.image || '').trim();
  const destinationUrl = getDestinationUrl(content);

  if (kind === 'video') {
    return getYouTubeThumbnail(destinationUrl);
  }

  if (kind === 'image') {
    return normalizedImage || destinationUrl;
  }

  if (!normalizedImage) {
    return '';
  }

  if (normalizedImage.includes('/content/image-proxy?')) {
    return normalizedImage;
  }

  if (!/^https?:\/\//i.test(normalizedImage)) {
    return normalizedImage;
  }

  const normalizedApiUrl = API_URL.replace(/\/+$/, '');
  const params = new URLSearchParams({ url: normalizedImage });

  if (destinationUrl) {
    params.set('source', destinationUrl);
  }

  return `${normalizedApiUrl}/content/image-proxy?${params.toString()}`;
}

// Produces a readable title with document and social fallbacks.
// Input: content item.
// Output: presentation-ready title string.
export function getDisplayTitle(content) {
  const normalizedType = String(content?.type || '').toLowerCase();
  const trimmedTitle = String(content?.title || '').trim();

  if (trimmedTitle) {
    return trimmedTitle;
  }

  if (normalizedType === 'image') {
    return 'Untitled Image';
  }

  if (normalizedType === 'pdf' || normalizedType === 'document') {
    return 'Untitled Document';
  }

  return 'Untitled Archive';
}

// Produces a concise description for cards without leaking long or noisy bodies into the UI.
// Input: content item.
// Output: clipped description string.
export function getDisplayDescription(content) {
  return String(content?.description || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

// Produces filtered searchable tags for chip display.
// Input: content item and optional max tag count.
// Output: deduplicated tag array.
export function getDisplayTags(content, limit = 4) {
  const tags = (content?.tags || [])
    .map((tag) => String(tag || '').toLowerCase().replace(/^#+/, '').trim())
    .filter((tag) => tag.length > 1 && !genericTags.has(tag));

  return Array.from(new Set(tags)).slice(0, limit);
}

// Returns the small uppercase badge shown on cards.
// Input: content item.
// Output: short label string for the card header.
export function getCardLabel(content) {
  const tags = getDisplayTags(content, 1);
  const kind = getContentKind(content);

  if (tags.length) {
    return tags[0].replace(/-/g, ' ').toUpperCase();
  }

  if (kind === 'video') {
    return 'DOCUMENTARY';
  }

  if (kind === 'document') {
    return 'WHITE PAPER';
  }

  if (kind === 'social') {
    return 'PHILOSOPHY';
  }

  if (kind === 'image') {
    return 'VISUAL';
  }

  return 'RESEARCH';
}

// Formats the saved timestamp for footer metadata.
// Input: content item.
// Output: relative time string.
export function getRelativeTime(content) {
  if (!content?.createdAt) {
    return 'Recently saved';
  }

  return dayjs(content.createdAt).fromNow();
}

// Builds the small footer note based on the content type.
// Input: content item.
// Output: short metadata string.
export function getFooterMeta(content) {
  const kind = getContentKind(content);
  const tags = getDisplayTags(content);

  if (kind === 'video' || kind === 'article') {
    const wordCount = String(content?.description || '').split(/\s+/).filter(Boolean).length;
    return `${Math.max(1, Math.round(wordCount / 160) || 1)} min read`;
  }

  if (kind === 'image') {
    return `${Math.max(tags.length, 1)} visual tag${tags.length === 1 ? '' : 's'}`;
  }

  if (kind === 'social') {
    return `${Math.max(String(content?.description || getDisplayTitle(content)).split(/\s+/).filter(Boolean).length, 12)} words`;
  }

  return 'Open original file';
}

// Builds list items for the document card checklist layout.
// Input: content item.
// Output: up to three checklist lines.
export function getDocumentChecklist(content) {
  const descriptionSentences = getDisplayDescription(content)
    .split(/[.!?]/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 8)
    .slice(0, 3);

  if (descriptionSentences.length) {
    return descriptionSentences;
  }

  const tags = getDisplayTags(content, 3).map((tag) => `Catalogued under ${tag.replace(/-/g, ' ')}`);
  return tags.length ? tags : ['Open the source file for the complete document.'];
}

// Generates a compact source label for article/social cards.
// Input: content item.
// Output: readable hostname or kind label.
export function getSourceLabel(content) {
  const fallback = getContentKind(content);

  try {
    const hostname = new URL(getDestinationUrl(content)).hostname.replace(/^www\./, '');
    return hostname || fallback;
  } catch {
    return fallback;
  }
}

function getYouTubeThumbnail(url) {
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return '';
  }

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function extractYouTubeId(url) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes('youtu.be')) {
      return parsedUrl.pathname.replace('/', '').trim();
    }

    return parsedUrl.searchParams.get('v') || '';
  } catch {
    return '';
  }
}

function isPdfUrl(url) {
  return /\.pdf(?:$|[?#])/i.test(String(url || '').trim());
}
