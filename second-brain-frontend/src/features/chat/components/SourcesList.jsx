import React from 'react';
import { Link2 } from 'lucide-react';
import SourceCard from './SourceCard';

// Retrieval source collection shown beneath a grounded answer.
// Input: normalized source objects from the RAG response.
// Output: card-based source section with readable metadata and links.
const SourcesList = ({
  sources = [],
}) => {
  if (!Array.isArray(sources) || !sources.length) {
    return null;
  }

  return (
    <section className="rounded-[28px] border border-[rgba(255,204,102,0.08)] bg-[rgba(17,13,11,0.74)] px-5 py-5 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(103,232,249,0.18)] bg-[rgba(103,232,249,0.08)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#9defff]">
          <Link2 className="h-3.5 w-3.5" />
          Sources
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-obsidian-500">
          Reviewed context
        </p>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {sources.map((source, index) => (
          <SourceCard
            key={source.id || `${source.contentId || 'answer-source'}-${index}`}
            source={source}
          />
        ))}
      </div>
    </section>
  );
};

export default SourcesList;
