function getFirstNonEmptyString(...values) {
  for (const value of values) {
    const normalizedValue = String(value || '').trim();

    if (normalizedValue) {
      return normalizedValue;
    }
  }

  return '';
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .map((tag) => String(tag || '').trim())
    .filter(Boolean);
}

// Normalizes saved content, semantic results, and resurfaced items into one card-ready shape.
// Input: raw content-like object and optional rendering context.
// Output: stable object that can be passed to ContentCard from any dashboard state.
export function normalizeContentItem(item, { context = 'default', index = 0 } = {}) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : {};
  const rawItem = item.raw && typeof item.raw === 'object' ? item.raw : item;
  // Prefer stable saved-content ids so card actions still target the original archive record.
  const deleteId = getFirstNonEmptyString(
    item.deleteId,
    item.contentId,
    metadata.contentId,
    item._id,
    rawItem._id,
    item.id,
    rawItem.id,
  );
  const fallbackCardId = deleteId || `content-${context}-${index}`;
  const cardId = getFirstNonEmptyString(
    item._id,
    item.cardId,
    context === 'search' ? item.id : '',
    fallbackCardId,
  );
  // Search payloads can surface chunk text first, while saved content usually prefers description fields.
  const title = getFirstNonEmptyString(
    item.title,
    metadata.title,
    rawItem.title,
    rawItem.name,
    'Untitled Content',
  );
  const description = getFirstNonEmptyString(
    item.matchedChunkText,
    item.description,
    item.summary,
    metadata.description,
    metadata.summary,
    metadata.text,
    rawItem.description,
    rawItem.summary,
  );
  const image = getFirstNonEmptyString(
    item.image,
    item.thumbnail,
    metadata.image,
    metadata.thumbnail,
    rawItem.image,
    rawItem.thumbnail,
  );
  const url = getFirstNonEmptyString(
    item.url,
    item.link,
    metadata.url,
    metadata.sourceUrl,
    rawItem.url,
    rawItem.link,
  );
  const type = getFirstNonEmptyString(
    item.type,
    metadata.type,
    rawItem.type,
  );
  const createdAt = getFirstNonEmptyString(
    item.createdAt,
    metadata.createdAt,
    rawItem.createdAt,
  );
  const matchedChunkText = getFirstNonEmptyString(
    item.matchedChunkText,
    metadata.text,
    rawItem.matchedChunkText,
  );
  const descriptionLanguage = getFirstNonEmptyString(
    item.descriptionLanguage,
    metadata.descriptionLanguage,
    rawItem.descriptionLanguage,
  );
  const tags = normalizeTags(item.tags ?? metadata.tags ?? rawItem.tags);

  return {
    ...item,
    _id: cardId,
    id: cardId,
    deleteId,
    contentId: deleteId,
    title,
    description,
    image,
    url,
    type,
    createdAt,
    matchedChunkText,
    descriptionLanguage,
    tags,
    metadata: {
      ...metadata,
      contentId: deleteId,
      title,
      description,
      descriptionLanguage,
      image,
      url,
      type,
      createdAt,
      tags,
      text: matchedChunkText || metadata.text || '',
    },
    raw: rawItem,
  };
}

export function normalizeContentCollection(items = [], options = {}) {
  if (!Array.isArray(items)) {
    return [];
  }

  // Remove invalid records early so grid renderers only receive card-safe objects.
  return items
    .map((item, index) => normalizeContentItem(item, { ...options, index }))
    .filter(Boolean);
}
