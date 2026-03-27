import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { getPreviewImage, getPreviewType } from './contentPreview.utils.js';

dayjs.extend(relativeTime);

const MAX_CARD_TITLE_CHARS = 58;
const MAX_CARD_DESCRIPTION_CHARS = 180;
const MAX_VISIBLE_TAGS = 3;
const MAX_TAG_CHARS = 16;
const MAX_CHECKLIST_ITEMS = 2;
const MAX_CHECKLIST_LINE_CHARS = 54;
const genericTags = new Set(['upload', 'image', 'pdf', 'document', 'article', 'link', 'social', 'video']);
const placeholderTitles = new Set(['no title', 'untitled archive', 'untitled document', 'untitled image']);

// Maps backend content into high-level visual families used by the card renderer.
// Input: saved content item from Redux.
// Output: normalized kind string for card presentation.
export function getContentKind(content) {
  const normalizedType = String(content?.type || '').toLowerCase();
  const previewType = getPreviewType(content);

  if (normalizedType === 'image' || previewType === 'image') {
    return 'image';
  }

  if (normalizedType === 'pdf' || normalizedType === 'document' || previewType === 'pdf') {
    return 'document';
  }

  if (previewType === 'youtube') {
    return 'video';
  }

  if (normalizedType === 'social') {
    return 'social';
  }

  if (['instagram', 'linkedin', 'twitter'].includes(previewType)) {
    return 'social';
  }

  return 'article';
}

// Returns the short type badge shown on each card.
// Input: content item.
// Output: compact badge label.
export function getTypeBadge(content) {
  const kind = getContentKind(content);
  const previewType = getPreviewType(content);

  if (kind === 'document') {
    return 'PDF';
  }

  if (kind === 'image') {
    return 'IMAGE';
  }

  if (kind === 'video') {
    return 'VIDEO';
  }

  if (['instagram', 'linkedin', 'twitter'].includes(previewType) || kind === 'social') {
    return 'SOCIAL';
  }

  return 'ARTICLE';
}

// Chooses a visual card variant while keeping every card preview-first.
// Input: content item and masonry index.
// Output: card variant string.
export function getCardVariant(content, index = 0) {
  const kind = getContentKind(content);

  if (kind === 'document') {
    return 'document';
  }

  if (kind === 'image' && index % 5 === 0) {
    return 'collection';
  }

  return 'media';
}

// Resolves the outbound destination URL for a card.
// Input: content item.
// Output: absolute URL string or `#`.
export function getDestinationUrl(content) {
  const destination = String(content?.url || content?.image || '').trim();
  return destination || '#';
}

// Resolves the visual preview source for a card.
// Input: content item.
// Output: image URL or generated fallback image URL.
export function getPreviewSource(content) {
  return getPreviewImage(content);
}

// Produces a readable title with frontend-side cleanup when saved metadata is low quality.
// Input: content item.
// Output: compact presentation-ready title string.
export function getDisplayTitle(content) {
  return truncateText(resolveTitleText(content), MAX_CARD_TITLE_CHARS);
}

// Produces a concise description while removing hashtags, contact dumps, and repeated title text.
// Input: content item.
// Output: clipped description string with a clean fallback.
export function getDisplayDescription(content) {
  const resolvedTitle = resolveTitleText(content);
  return truncateText(resolveDescriptionText(content, resolvedTitle), MAX_CARD_DESCRIPTION_CHARS);
}

// Returns the small description label shown above the card description body.
// Input: content item.
// Output: stable label string such as `Description EN`.
export function getDescriptionLabel(content) {
  return String(content?.descriptionLanguage || '').trim().toLowerCase() === 'en'
    ? 'Description EN'
    : 'Description';
}

// Produces filtered searchable tags for chip display.
// Input: content item and optional maximum tag count.
// Output: deduplicated normalized tag array formatted for the card UI.
export function getDisplayTags(content, limit = MAX_VISIBLE_TAGS) {
  const rawTags = (content?.tags || [])
    .map((tag) => String(tag || '').toLowerCase().replace(/^#+/, '').trim())
    .filter((tag) => tag.length > 1 && !genericTags.has(tag) && !looksLikeHashtagWall(tag));

  return Array.from(new Set(rawTags))
    .slice(0, limit)
    .map(formatTagLabel);
}

// Returns the small uppercase badge shown inside the preview area.
// Input: content item.
// Output: short label string.
export function getCardLabel(content) {
  const tags = getDisplayTags(content, 1);
  const previewType = getPreviewType(content);

  if (tags.length) {
    return truncateText(tags[0].replace(/-/g, ' ').toUpperCase(), 18);
  }

  const labels = {
    youtube: 'YOUTUBE',
    instagram: 'INSTAGRAM',
    linkedin: 'LINKEDIN',
    twitter: 'X / TWITTER',
    pdf: 'PDF DOCUMENT',
    image: 'VISUAL',
    article: 'WEB LINK',
  };

  return labels[previewType] || 'ARCHIVE';
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

// Formats a conversational saved-time label that can be reused across resurfacing, search, and chat cards.
// Input: content-like object with `createdAt` and an optional conversational flag.
// Output: short label such as "Saved 2 months ago" or "You saved this 2 months ago".
export function getSavedTimeLabel(content, { conversational = false } = {}) {
  if (!content?.createdAt) {
    return conversational ? 'Saved recently' : 'Saved recently';
  }

  const relativeTime = dayjs(content.createdAt).fromNow();
  return conversational ? `You saved this ${relativeTime}` : `Saved ${relativeTime}`;
}

// Builds the small footer note based on the content type.
// Input: content item.
// Output: short metadata string.
export function getFooterMeta(content) {
  const kind = getContentKind(content);

  if (kind === 'document') {
    return 'Open PDF';
  }

  if (kind === 'image') {
    return 'Open image';
  }

  if (kind === 'social') {
    return 'Social capture';
  }

  if (kind === 'video') {
    return 'Video reference';
  }

  return 'Saved link';
}

// Builds list items for the document detail block without exposing contact-heavy OCR dumps.
// Input: content item.
// Output: up to two short checklist lines.
export function getDocumentChecklist(content) {
  const resolvedTitle = resolveTitleText(content);
  const cleanedDescription = resolveDescriptionText(content, resolvedTitle);
  const descriptionSentences = cleanedDescription
    .split(/[.!?]/)
    .map((sentence) => normalizeText(sentence))
    .filter((sentence) => sentence.length > 8)
    .slice(0, MAX_CHECKLIST_ITEMS)
    .map((sentence) => truncateText(sentence, MAX_CHECKLIST_LINE_CHARS));

  if (descriptionSentences.length) {
    return descriptionSentences;
  }

  const tags = getDisplayTags(content, 2).map((tag) => `Tagged under ${tag}`);
  return tags.length ? tags : ['Open the source file for the complete document.'];
}

// Generates a compact source label for card metadata.
// Input: content item.
// Output: readable source label string.
export function getSourceLabel(content) {
  const previewType = getPreviewType(content);
  const previewLabels = {
    youtube: 'youtube',
    instagram: 'instagram',
    linkedin: 'linkedin',
    twitter: 'x / twitter',
    pdf: 'pdf document',
    image: 'image upload',
  };

  if (previewLabels[previewType]) {
    return previewLabels[previewType];
  }

  try {
    const hostname = new URL(getDestinationUrl(content)).hostname.replace(/^www\./, '');
    return hostname || 'archive';
  } catch {
    return previewType === 'image' ? 'image upload' : 'archive';
  }
}

function resolveTitleText(content) {
  const kind = getContentKind(content);
  const previewType = getPreviewType(content);
  const titleCandidates = [
    normalizeTitleCandidate(content?.title, previewType),
    extractTitleFromDescription(content?.description),
    previewType === 'youtube' ? '' : extractTitleFromUrl(getDestinationUrl(content)),
  ];

  const resolvedTitle = titleCandidates.find(Boolean);

  if (resolvedTitle) {
    return resolvedTitle;
  }

  if (kind === 'image') {
    return 'Untitled Image';
  }

  if (kind === 'document') {
    return 'Untitled PDF';
  }

  if (kind === 'video') {
    return 'YouTube Video';
  }

  return 'Untitled Archive';
}

function resolveDescriptionText(content, resolvedTitle) {
  const kind = getContentKind(content);
  const description = cleanDescriptionText(content?.description, resolvedTitle);

  if (description) {
    return description;
  }

  if (kind === 'document') {
    return 'No description available';
  }

  if (kind === 'video') {
    return 'No description available';
  }

  if (kind === 'social') {
    return 'No description available';
  }

  if (kind === 'image') {
    return 'No description available';
  }

  return 'No description available';
}

function normalizeTitleCandidate(value, previewType = '') {
  const normalizedTitle = normalizeText(value);

  if (!normalizedTitle) {
    return '';
  }

  if (placeholderTitles.has(normalizedTitle.toLowerCase())) {
    return '';
  }

  if (looksLikeHashtagWall(normalizedTitle) || looksLikeContactLine(normalizedTitle)) {
    return '';
  }

  if (previewType === 'youtube' && looksLikeYouTubeId(normalizedTitle)) {
    return '';
  }

  return polishTitle(stripLeadingNoise(normalizedTitle));
}

function extractTitleFromDescription(value) {
  const lines = String(value || '')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => normalizeText(removeContactFragments(stripLeadingNoise(line))))
    .filter(Boolean)
    .filter((line) => !looksLikeHashtagWall(line) && !looksLikeContactLine(line));

  const titleCandidate = lines.find((line) => {
    const wordCount = line.split(/\s+/).filter(Boolean).length;
    return line.length >= 12 && wordCount >= 3 && wordCount <= 10;
  });

  return titleCandidate ? polishTitle(titleCandidate) : '';
}

function cleanDescriptionText(value, resolvedTitle = '') {
  const cleanedLines = String(value || '')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => stripLeadingNoise(line))
    .map(removeContactFragments)
    .map(normalizeText)
    .filter(Boolean)
    .filter((line) => !looksLikeHashtagWall(line) && !looksLikeContactLine(line));

  if (!cleanedLines.length) {
    return '';
  }

  const normalizedTitle = normalizeText(resolvedTitle).toLowerCase();
  const cleanedDescription = cleanedLines
    .map((line) => {
      if (!normalizedTitle) {
        return line;
      }

      if (line.toLowerCase() === normalizedTitle) {
        return '';
      }

      if (line.toLowerCase().startsWith(normalizedTitle)) {
        return normalizeText(line.slice(normalizedTitle.length).replace(/^(\s|:|\||,|\.|-)+/, ''));
      }

      return line;
    })
    .filter(Boolean)
    .join(' ');

  return normalizeText(cleanedDescription);
}

function formatTagLabel(tag) {
  return truncateText(
    String(tag || '')
      .replace(/-/g, ' ')
      .trim(),
    MAX_TAG_CHARS,
  );
}

function normalizeText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitleFromUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1] || parsedUrl.hostname.replace(/^www\./, '');
    const withoutExtension = lastSegment.replace(/\.[a-z0-9]{2,6}$/i, '');
    const withoutQueryNoise = withoutExtension.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();

    if (!withoutQueryNoise) {
      return '';
    }

    return polishTitle(humanizeTitle(withoutQueryNoise));
  } catch {
    return '';
  }
}

function humanizeTitle(value) {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .map((segment) => {
      if (segment.length <= 3 && segment === segment.toUpperCase()) {
        return segment;
      }

      return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
    })
    .join(' ');
}

function polishTitle(value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return '';
  }

  if (normalizedValue === normalizedValue.toLowerCase()) {
    return humanizeTitle(normalizedValue);
  }

  return normalizedValue;
}

function looksLikeHashtagWall(value) {
  const normalizedValue = normalizeText(value);
  const hashtags = normalizedValue.match(/#[a-z0-9][a-z0-9-]*/gi) || [];
  const words = normalizedValue.match(/[a-z0-9]+/gi) || [];

  return hashtags.length >= 3 && hashtags.length >= Math.ceil(words.length * 0.4);
}

function looksLikeContactLine(value) {
  const normalizedValue = String(value || '');

  return /\b\S+@\S+\.\S+\b/.test(normalizedValue)
    || /\+?\d[\d\s().-]{7,}\d/.test(normalizedValue)
    || /\b(?:linkedin|github|portfolio|leetcode|mailto|www\.|https?:\/\/)\b/i.test(normalizedValue);
}

function stripLeadingNoise(value) {
  const normalizedValue = normalizeText(value)
    .replace(/^(?:#[a-z0-9][a-z0-9-]*\s*){3,}/gi, '')
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .trim();

  return normalizedValue;
}

function removeContactFragments(value) {
  return String(value || '')
    .replace(/\b\S+@\S+\.\S+\b/gi, ' ')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, ' ')
    .replace(/\b(?:linkedin|github|portfolio|leetcode)\b/gi, ' ')
    .replace(/\bhttps?:\/\/\S+/gi, ' ')
    .replace(/\bwww\.\S+/gi, ' ')
    .replace(/[|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateText(value, maxLength) {
  const normalizedValue = normalizeText(value);

  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function looksLikeYouTubeId(value) {
  return /^[a-zA-Z0-9_-]{10,12}$/.test(String(value || '').trim());
}
