import React, { Fragment, useMemo } from 'react';

const sectionHeadings = new Set([
  'answer',
  'summary',
  'overview',
  'details',
  'analysis',
  'key point',
  'key points',
  'takeaway',
  'takeaways',
  'recommendation',
  'recommendations',
  'next step',
  'next steps',
  'why it matters',
  'sources',
  'source',
  'references',
  'reference',
  'citations',
  'citation',
]);

const sourceSectionHeadings = new Set(['source', 'sources', 'reference', 'references', 'citation', 'citations']);

// Smart formatter that turns raw assistant text into readable sections.
// Input: raw answer text and whether a dedicated sources section exists outside the answer.
// Output: polished paragraphs, headings, lists, and clickable inline links.
const AnswerFormatter = ({
  text = '',
  hasSources = false,
}) => {
  const blocks = useMemo(() => buildAnswerBlocks(text, { hasSources }), [hasSources, text]);

  if (!blocks.length) {
    return (
      <p className="text-sm leading-7 text-obsidian-400">
        I found relevant context, but the answer came back empty.
      </p>
    );
  }

  let paragraphIndex = 0;

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <div key={`heading-${block.text}-${index}`} className="pt-1">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent-soft">
                {block.text}
              </h3>
            </div>
          );
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';

          return (
            <ListTag
              key={`list-${index}`}
              className={`space-y-2 pl-5 text-[15px] leading-7 text-obsidian-200 ${
                block.ordered ? 'list-decimal marker:text-accent' : 'list-disc marker:text-accent'
              }`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`item-${index}-${itemIndex}`} className="pl-1">
                  {renderInlineContent(item, `list-${index}-${itemIndex}`)}
                </li>
              ))}
            </ListTag>
          );
        }

        const isLeadParagraph = paragraphIndex === 0 && shouldHighlightParagraph(block.text, blocks.length);
        paragraphIndex += 1;

        if (isLeadParagraph) {
          return (
            <div
              key={`paragraph-${index}`}
              className="rounded-[22px] border border-[rgba(255,191,64,0.14)] bg-[linear-gradient(135deg,rgba(255,191,67,0.08),rgba(103,232,249,0.05))] px-4 py-4"
            >
              <p className="text-[15.5px] font-medium leading-8 text-[#fff2d7]">
                {renderInlineContent(block.text, `lead-${index}`)}
              </p>
            </div>
          );
        }

        return (
          <p key={`paragraph-${index}`} className="text-[15px] leading-7 text-obsidian-200">
            {renderInlineContent(block.text, `paragraph-${index}`)}
          </p>
        );
      })}
    </div>
  );
};

function buildAnswerBlocks(text, { hasSources }) {
  const normalizedText = cleanAnswerText(text);

  if (!normalizedText) {
    return [];
  }

  const blocks = [];
  const lines = normalizedText.split('\n');
  let paragraphLines = [];
  let listItems = [];
  let isOrderedList = null;

  const flushParagraph = () => {
    if (!paragraphLines.length) {
      return;
    }

    const paragraph = paragraphLines.join(' ').replace(/\s+/g, ' ').trim();
    paragraphLines = [];

    splitLongParagraph(paragraph).forEach((segment) => {
      if (segment) {
        blocks.push({
          type: 'paragraph',
          text: segment,
        });
      }
    });
  };

  const flushList = () => {
    if (!listItems.length) {
      return;
    }

    blocks.push({
      type: 'list',
      ordered: Boolean(isOrderedList),
      items: [...listItems],
    });
    listItems = [];
    isOrderedList = null;
  };

  for (const rawLine of lines) {
    const line = String(rawLine || '').trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const inlineHeadingMatch = line.match(/^([A-Za-z][A-Za-z\s/&-]{1,40})\s*:\s*(.+)$/);

    if (inlineHeadingMatch && isRecognizedHeading(inlineHeadingMatch[1])) {
      flushParagraph();
      flushList();

      if (hasSources && isSourceHeading(inlineHeadingMatch[1])) {
        break;
      }

      blocks.push({
        type: 'heading',
        text: normalizeHeading(inlineHeadingMatch[1]),
      });
      paragraphLines.push(inlineHeadingMatch[2]);
      continue;
    }

    if (isHeadingLine(line)) {
      flushParagraph();
      flushList();

      if (hasSources && isSourceHeading(line)) {
        break;
      }

      blocks.push({
        type: 'heading',
        text: normalizeHeading(line),
      });
      continue;
    }

    const listMatch = parseListLine(line);

    if (listMatch) {
      flushParagraph();

      if (isOrderedList === null) {
        isOrderedList = listMatch.ordered;
      }

      if (isOrderedList !== listMatch.ordered) {
        flushList();
        isOrderedList = listMatch.ordered;
      }

      listItems.push(listMatch.text);
      continue;
    }

    if (listItems.length) {
      flushList();
    }

    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

function cleanAnswerText(value) {
  const normalizedText = String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\u2022/g, '- ')
    .replace(/\n[-_]{3,}\n/g, '\n\n')
    .trim();

  if (!normalizedText) {
    return '';
  }

  if (!normalizedText.includes('\n') && normalizedText.length > 320) {
    return splitLongParagraph(normalizedText).join('\n\n');
  }

  return normalizedText;
}

function splitLongParagraph(value) {
  const normalizedValue = String(value || '').replace(/\s+/g, ' ').trim();

  if (!normalizedValue) {
    return [];
  }

  if (normalizedValue.length <= 260) {
    return [normalizedValue];
  }

  const sentences = normalizedValue
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length < 2) {
    return [normalizedValue];
  }

  const segments = [];
  let currentSegment = '';

  sentences.forEach((sentence) => {
    if (!currentSegment) {
      currentSegment = sentence;
      return;
    }

    const nextSegment = `${currentSegment} ${sentence}`.trim();

    if (currentSegment.length >= 180 || nextSegment.length > 240) {
      segments.push(currentSegment);
      currentSegment = sentence;
      return;
    }

    currentSegment = nextSegment;
  });

  if (currentSegment) {
    segments.push(currentSegment);
  }

  return segments.length ? segments : [normalizedValue];
}

function parseListLine(line) {
  const bulletMatch = line.match(/^[-*]\s+(.+)$/);

  if (bulletMatch) {
    return {
      ordered: false,
      text: bulletMatch[1].trim(),
    };
  }

  const orderedMatch = line.match(/^\d+\.\s+(.+)$/);

  if (orderedMatch) {
    return {
      ordered: true,
      text: orderedMatch[1].trim(),
    };
  }

  return null;
}

function isHeadingLine(line) {
  if (!line) {
    return false;
  }

  const normalizedHeading = normalizeHeading(line);

  if (isRecognizedHeading(normalizedHeading)) {
    return true;
  }

  return /^[A-Za-z][A-Za-z\s/&-]{1,32}:$/.test(line);
}

function isRecognizedHeading(value) {
  const normalizedHeading = normalizeHeading(value).toLowerCase();
  return sectionHeadings.has(normalizedHeading);
}

function isSourceHeading(value) {
  const normalizedHeading = normalizeHeading(value).toLowerCase();
  return sourceSectionHeadings.has(normalizedHeading);
}

function normalizeHeading(value) {
  return String(value || '')
    .replace(/^#{1,6}\s*/, '')
    .replace(/[:\uFF1A]\s*$/, '')
    .trim();
}

function shouldHighlightParagraph(value, blockCount) {
  const normalizedValue = String(value || '').trim();

  if (!normalizedValue) {
    return false;
  }

  return blockCount > 1 && normalizedValue.length >= 48;
}

function renderInlineContent(text, keyPrefix) {
  const value = String(text || '');
  const nodes = [];
  const tokenPattern = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(https?:\/\/[^\s<]+)|(`[^`]+`)|(\*\*[^*]+\*\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = tokenPattern.exec(value)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={`${keyPrefix}-text-${lastIndex}`}>
          {value.slice(lastIndex, match.index)}
        </Fragment>,
      );
    }

    if (match[1]) {
      const label = String(match[2] || 'View Source').trim() || 'View Source';
      const url = sanitizeUrl(match[3]);

      if (url) {
        nodes.push(renderLink(url, label, `${keyPrefix}-markdown-${match.index}`));
      }
    } else if (match[4]) {
      const urlToken = normalizeUrlToken(match[4]);

      if (urlToken.url) {
        nodes.push(renderLink(urlToken.url, 'View Source', `${keyPrefix}-url-${match.index}`));
      }

      if (urlToken.trailingText) {
        nodes.push(
          <Fragment key={`${keyPrefix}-trailing-${match.index}`}>
            {urlToken.trailingText}
          </Fragment>,
        );
      }
    } else if (match[5]) {
      nodes.push(
        <code
          key={`${keyPrefix}-code-${match.index}`}
          className="rounded-md border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.04)] px-1.5 py-0.5 text-[0.94em] text-[#fff2d7]"
        >
          {match[5].slice(1, -1)}
        </code>,
      );
    } else if (match[6]) {
      nodes.push(
        <strong key={`${keyPrefix}-bold-${match.index}`} className="font-semibold text-[#fff2d7]">
          {match[6].slice(2, -2)}
        </strong>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < value.length) {
    nodes.push(
      <Fragment key={`${keyPrefix}-tail`}>
        {value.slice(lastIndex)}
      </Fragment>,
    );
  }

  return nodes;
}

function renderLink(url, label, key) {
  return (
    <a
      key={key}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center rounded-full border border-[rgba(103,232,249,0.2)] bg-[rgba(103,232,249,0.08)] px-2.5 py-1 text-[0.82em] font-semibold text-[#a7f4ff] transition-colors hover:border-[rgba(103,232,249,0.34)] hover:text-[#d6fcff]"
    >
      {label}
    </a>
  );
}

function normalizeUrlToken(rawUrl) {
  const trailingMatch = String(rawUrl || '').match(/[).,;!?]+$/);
  const trailingText = trailingMatch ? trailingMatch[0] : '';
  const url = sanitizeUrl(
    trailingText
      ? rawUrl.slice(0, rawUrl.length - trailingText.length)
      : rawUrl,
  );

  return {
    url,
    trailingText,
  };
}

function sanitizeUrl(value) {
  const url = String(value || '').trim();

  if (!/^https?:\/\//i.test(url)) {
    return '';
  }

  return url;
}

export default AnswerFormatter;
