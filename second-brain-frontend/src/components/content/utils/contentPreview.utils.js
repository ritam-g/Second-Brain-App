const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000/api';

const fallbackPreviewConfigs = {
  youtube: {
    eyebrow: 'Video Archive',
    heading: 'YouTube Reference',
    subheading: 'Video knowledge preserved with a visual thumbnail fallback.',
    startColor: '#ff8b3d',
    endColor: '#8f1737',
    accentColor: '#ffe5d2',
    accentSurface: '#3b130f',
  },
  instagram: {
    eyebrow: 'Social Capture',
    heading: 'Instagram Snapshot',
    subheading: 'Visual inspiration saved even when the original image is missing.',
    startColor: '#ff9a3c',
    endColor: '#8d2fd1',
    accentColor: '#ffe5c8',
    accentSurface: '#35101a',
  },
  linkedin: {
    eyebrow: 'Professional Insight',
    heading: 'LinkedIn Preview',
    subheading: 'Career and industry context stays visible inside the archive.',
    startColor: '#1d87ff',
    endColor: '#08396a',
    accentColor: '#d9eeff',
    accentSurface: '#0b2338',
  },
  twitter: {
    eyebrow: 'Conversation Capture',
    heading: 'X / Twitter Thread',
    subheading: 'Thread and social context saved with a branded fallback preview.',
    startColor: '#6f86ff',
    endColor: '#101828',
    accentColor: '#e5ebff',
    accentSurface: '#141b2f',
  },
  pdf: {
    eyebrow: 'Document Archive',
    heading: 'PDF Document',
    subheading: 'Open the original file to read the full contents.',
    startColor: '#f8ae1d',
    endColor: '#5f3310',
    accentColor: '#fff0cc',
    accentSurface: '#38210d',
  },
  image: {
    eyebrow: 'Visual Archive',
    heading: 'Saved Image',
    subheading: 'Image preview unavailable, showing a visual fallback instead.',
    startColor: '#8bc6ff',
    endColor: '#2f577b',
    accentColor: '#e1f3ff',
    accentSurface: '#16293a',
  },
  article: {
    eyebrow: 'Web Archive',
    heading: 'Saved Link',
    subheading: 'Open Graph image unavailable, using a generated article cover.',
    startColor: '#f0b75a',
    endColor: '#46301d',
    accentColor: '#fff0cf',
    accentSurface: '#312316',
  },
  generic: {
    eyebrow: 'Second Brain',
    heading: 'Saved Content',
    subheading: 'A visual placeholder keeps every card readable inside the gallery.',
    startColor: '#d09d53',
    endColor: '#3b2c1d',
    accentColor: '#fff0d7',
    accentSurface: '#2c1f16',
  },
};

// Resolves the visual preview family for a content item.
// Input: saved content document from the API.
// Output: normalized preview type string such as `youtube`, `linkedin`, `pdf`, or `article`.
export function getPreviewType(content) {
  const normalizedType = String(content?.type || '').toLowerCase();
  const normalizedUrl = String(content?.url || '').toLowerCase();

  if (normalizedType === 'pdf' || normalizedType === 'document' || isPdfUrl(normalizedUrl)) {
    return 'pdf';
  }

  if (normalizedType === 'youtube' || normalizedUrl.includes('youtube.com') || normalizedUrl.includes('youtu.be')) {
    return 'youtube';
  }

  if (normalizedType === 'instagram' || normalizedUrl.includes('instagram.com')) {
    return 'instagram';
  }

  if (normalizedType === 'linkedin' || normalizedUrl.includes('linkedin.com')) {
    return 'linkedin';
  }

  if (normalizedType === 'social') {
    return 'article';
  }

  if (
    ['tweet', 'x', 'twitter'].includes(normalizedType)
    || normalizedUrl.includes('twitter.com')
    || normalizedUrl.includes('x.com')
  ) {
    return 'twitter';
  }

  if (normalizedType === 'image' || looksLikeImageUrl(normalizedUrl)) {
    return 'image';
  }

  return 'article';
}

// Resolves the best possible preview image URL for a content item.
// Input: saved content document from the API.
// Output: routed preview URL or a generated data-URI fallback image.
export function getPreviewImage(data) {
  const previewType = getPreviewType(data);
  const destinationUrl = String(data?.url || '').trim();
  const normalizedImage = String(data?.image || '').trim();

  if (previewType === 'youtube') {
    return getYouTubeThumbnail(destinationUrl) || getFallbackImage('youtube');
  }

  if (previewType === 'image') {
    const imagePreview = routePreviewImage(normalizedImage || destinationUrl, destinationUrl);
    return imagePreview || getFallbackImage('image');
  }

  if (previewType === 'pdf') {
    // PDFs now come back with an optional thumbnail in `image`.
    // Use that when available, and fall back to the branded PDF cover otherwise.
    const pdfPreview = routePreviewImage(normalizedImage, destinationUrl);
    return pdfPreview || getFallbackImage('pdf');
  }

  if (normalizedImage) {
    const imagePreview = routePreviewImage(normalizedImage, destinationUrl);
    return imagePreview || getFallbackImage(previewType);
  }

  return getFallbackImage(previewType);
}

// Generates a branded fallback image so cards never render as text-only.
// Input: preview type string.
// Output: data-URI SVG image string.
export function getFallbackImage(type) {
  const normalizedType = String(type || '').toLowerCase();
  const config = fallbackPreviewConfigs[normalizedType] || fallbackPreviewConfigs.generic;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 760" role="img" aria-label="${escapeXml(config.heading)}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${config.startColor}" />
          <stop offset="100%" stop-color="${config.endColor}" />
        </linearGradient>
        <radialGradient id="glowPrimary" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${config.accentColor}" stop-opacity="0.45" />
          <stop offset="100%" stop-color="${config.accentColor}" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="glowSecondary" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.16" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
      </defs>

      <rect width="1200" height="760" rx="44" fill="#0f0b09" />
      <rect x="20" y="20" width="1160" height="720" rx="36" fill="url(#bg)" />
      <circle cx="970" cy="140" r="220" fill="url(#glowPrimary)" />
      <circle cx="1045" cy="625" r="260" fill="url(#glowSecondary)" />

      <rect x="90" y="94" width="196" height="42" rx="21" fill="${config.accentSurface}" fill-opacity="0.94" />
      <text x="118" y="121" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="${config.accentColor}">
        ${escapeXml(config.eyebrow)}
      </text>

      <text x="90" y="264" font-family="Arial, sans-serif" font-size="72" font-weight="800" fill="#fff7e8">
        ${escapeXml(config.heading)}
      </text>
      <text x="90" y="332" font-family="Arial, sans-serif" font-size="28" fill="${config.accentColor}" fill-opacity="0.92">
        ${escapeXml(config.subheading)}
      </text>

      <rect x="90" y="416" width="436" height="210" rx="30" fill="#0f0b09" fill-opacity="0.18" stroke="#fff7e8" stroke-opacity="0.14" />
      <rect x="652" y="124" width="374" height="500" rx="34" fill="#0f0b09" fill-opacity="0.18" stroke="#fff7e8" stroke-opacity="0.14" />
      <rect x="710" y="180" width="258" height="164" rx="28" fill="#fff7e8" fill-opacity="0.1" />
      <rect x="710" y="372" width="214" height="28" rx="14" fill="#fff7e8" fill-opacity="0.18" />
      <rect x="710" y="420" width="160" height="18" rx="9" fill="#fff7e8" fill-opacity="0.12" />
      <rect x="710" y="454" width="188" height="18" rx="9" fill="#fff7e8" fill-opacity="0.12" />

      <circle cx="214" cy="520" r="66" fill="#fff7e8" fill-opacity="0.09" />
      <circle cx="310" cy="520" r="66" fill="#fff7e8" fill-opacity="0.07" />
      <circle cx="406" cy="520" r="66" fill="#fff7e8" fill-opacity="0.05" />
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// Builds a high-quality thumbnail URL for YouTube content.
// Input: YouTube URL.
// Output: public YouTube thumbnail URL string or an empty string.
export function getYouTubeThumbnail(url) {
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return '';
  }

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function routePreviewImage(rawUrl, sourceUrl) {
  const previewUrl = String(rawUrl || '').trim();

  if (!previewUrl) {
    return '';
  }

  if (
    previewUrl.startsWith('data:image/')
    || previewUrl.startsWith('blob:')
    || previewUrl.startsWith('/')
    || previewUrl.includes('/content/image-proxy?')
  ) {
    return previewUrl;
  }

  if (!/^https?:\/\//i.test(previewUrl)) {
    return previewUrl;
  }

  if (shouldBypassProxy(previewUrl)) {
    return previewUrl;
  }

  const normalizedApiUrl = API_URL.replace(/\/+$/, '');
  const params = new URLSearchParams({ url: previewUrl });

  if (sourceUrl) {
    params.set('source', sourceUrl);
  }

  return `${normalizedApiUrl}/content/image-proxy?${params.toString()}`;
}

function shouldBypassProxy(url) {
  try {
    const parsedUrl = new URL(url);
    return ['img.youtube.com', 'i.ytimg.com'].includes(parsedUrl.hostname.toLowerCase());
  } catch {
    return false;
  }
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

function looksLikeImageUrl(url) {
  return /\.(png|jpe?g|webp|gif|bmp|svg)(?:$|[?#])/i.test(String(url || '').trim());
}

function isPdfUrl(url) {
  return /\.pdf(?:$|[?#])/i.test(String(url || '').trim());
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
