import React from 'react';
import { ExternalLink, Trash2 } from 'lucide-react';

// Hover overlay actions for content cards.
// Input: destination URL, delete callback, and loading state.
// Output: floating action pill rendered over the card preview.
const CardOverlayActions = ({ href, onDelete, loading }) => {
  const hasDestination = Boolean(href && href !== '#');

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-20 flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
      {hasDestination ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(255,204,102,0.12)] bg-[rgba(12,9,8,0.75)] text-[#fff2d7] backdrop-blur-xl transition-colors hover:border-[rgba(255,191,64,0.2)] hover:text-accent"
          title="Open original"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      ) : null}

      <button
        type="button"
        onClick={onDelete}
        disabled={loading}
        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-red-500/20 bg-[rgba(22,8,8,0.82)] text-red-200 backdrop-blur-xl transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        title="Delete content"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};

export default CardOverlayActions;
