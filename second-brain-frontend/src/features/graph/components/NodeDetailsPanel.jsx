import React, { useEffect, useState } from 'react';
import { ExternalLink, Link2, Share2, Sparkles } from 'lucide-react';
import GlassCard from '../../../components/ui/GlassCard';
import Button from '../../../components/ui/Button';

/**
 * NodeDetailsPanel Component
 * Responsibility: turns the selected graph node into a readable inspection panel.
 * Handles: node metadata, related links, and open-content actions.
 */
const NodeDetailsPanel = ({
  node,
  content,
  relatedNodes = [],
  relationCount = 0,
  strongestRelation = null,
  onOpenContent,
  onSelectRelatedNode,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [content?.image, node?.image, node?.id]);

  if (!node) {
    return (
      <GlassCard
        className="node-details-panel debug-node-details-panel h-full px-6 py-8"
        data-debug="node-details-panel-empty"
      >
        <div className="mx-auto flex h-full max-w-sm flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-[rgba(248,174,29,0.12)] text-accent">
            <Share2 className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-2xl font-bold text-[#fff1d5]">Select a node to inspect the relationship map.</h2>
          <p className="mt-3 text-sm leading-7 text-obsidian-400">
            Click any connected thought to inspect its semantic neighborhood, related sources, and original content entry.
          </p>
        </div>
      </GlassCard>
    );
  }

  const resolvedImage = String(content?.image || node?.image || '').trim();
  const resolvedTitle = String(content?.title || node?.title || 'Untitled Content').trim();
  const resolvedDescription = normalizeText(content?.description || content?.summary)
    || 'This node is part of your semantic knowledge graph and represents a saved artifact in the archive.';
  const resolvedType = formatTypeLabel(content?.type || node?.type);
  const resolvedTags = Array.isArray(content?.tags) ? content.tags.slice(0, 4) : [];
  const canOpenContent = Boolean(String(content?.url || '').trim());
  const strongestPercent = strongestRelation !== null
    ? `${Math.round(Math.max(0, Math.min(1, strongestRelation)) * 100)}%`
    : 'No links yet';

  return (
    <GlassCard
      className="node-details-panel debug-node-details-panel h-full overflow-hidden"
      data-debug="node-details-panel"
      data-node-id={node?.id || ''}
      data-node-type={content?.type || node?.type || 'unknown'}
    >
      <div className="flex h-full flex-col">
        <div className="node-details-media debug-node-details-media relative shrink-0 overflow-hidden border-b border-[rgba(255,204,102,0.08)]" data-debug="node-details-media">
          {resolvedImage && !imageFailed ? (
            <img
              src={resolvedImage}
              alt={resolvedTitle}
              className="node-details-image debug-node-details-image h-full w-full rounded-md object-cover"
              data-debug="node-details-image"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="node-details-image-fallback debug-node-details-image-fallback h-56 w-full bg-[radial-gradient(circle_at_top_left,_rgba(103,232,249,0.22),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(248,174,29,0.2),_transparent_28%),linear-gradient(180deg,rgba(28,22,18,0.96),rgba(14,11,9,1))]" data-debug="node-details-image-fallback" />
          )}

          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,8,7,0)_18%,rgba(10,8,7,0.86)_100%)]" />

          <div className="absolute inset-x-0 bottom-0 p-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,191,64,0.18)] bg-[rgba(14,11,9,0.68)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5" />
              Active Node
            </div>

            <h2 className="node-details-title debug-node-details-title mt-4 text-[2rem] font-extrabold leading-tight text-[#fff1d5]">{resolvedTitle}</h2>
            <p className="node-details-description debug-node-details-description mt-3 text-sm leading-7 text-obsidian-300">{resolvedDescription}</p>
          </div>
        </div>

        <div className="node-details-body debug-node-details-body obsidian-scroll flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6" data-debug="node-details-body">
          <div className="node-details-stats debug-node-details-stats grid gap-3 sm:grid-cols-2" data-debug="node-details-stats">
            <StatCard label="Content Type" value={resolvedType} />
            <StatCard label="Connected Nodes" value={String(relationCount)} />
            <StatCard label="Strongest Link" value={strongestPercent} />
            <StatCard label="Node ID" value={String(node.id || '').slice(-8) || 'Unknown'} subtle />
          </div>

          {resolvedTags.length ? (
            <div className="node-details-tags debug-node-details-tags" data-debug="node-details-tags">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-obsidian-500">Semantic Tags</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {resolvedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-xs font-semibold text-obsidian-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="node-details-related debug-node-details-related" data-debug="node-details-related">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-accent" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-obsidian-500">Related Nodes</p>
            </div>

            {relatedNodes.length ? (
              <ul className="mt-4 space-y-3">
                {relatedNodes.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelectRelatedNode?.(item.id)}
                      className="node-related-item debug-node-related-item flex w-full items-start justify-between gap-4 rounded-2xl border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-left transition-colors hover:border-[rgba(103,232,249,0.18)] hover:bg-[rgba(103,232,249,0.06)]"
                      data-debug="node-related-item"
                      data-related-node-id={item.id}
                      data-related-node-type={item.type}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#fff1d5]">{item.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-obsidian-500">{formatTypeLabel(item.type)}</p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-accent-soft">{item.weightLabel}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-7 text-obsidian-400">
                This node has not formed any high-confidence semantic edges yet. Save more closely related material to strengthen the graph.
              </p>
            )}
          </div>

          <div className="mt-auto">
            <Button
              type="button"
              variant={canOpenContent ? 'amber' : 'surface'}
              className="node-details-open-button debug-node-details-open-button w-full rounded-2xl py-3 text-sm font-bold"
              leadingIcon={<ExternalLink className="h-4 w-4" />}
              data-debug="node-details-open-button"
              onClick={onOpenContent}
              disabled={!canOpenContent}
            >
              {canOpenContent ? 'Open Original Content' : 'Original Content Unavailable'}
            </Button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

/**
 * StatCard Component
 * Responsibility: presents one compact graph metric in a scan-friendly format.
 */
function StatCard({ label, value, subtle = false }) {
  return (
    <div
      className="node-stat-card debug-node-stat-card rounded-[24px] border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.02)] px-4 py-4"
      data-debug="node-stat-card"
      data-label={label}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-obsidian-500">{label}</p>
      <p className={`mt-3 text-lg font-bold ${subtle ? 'text-obsidian-300' : 'text-accent-soft'}`}>{value}</p>
    </div>
  );
}

function normalizeText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatTypeLabel(type) {
  const normalizedType = String(type || '').toLowerCase();
  const labels = {
    article: 'Article',
    youtube: 'Video',
    video: 'Video',
    pdf: 'PDF',
    document: 'Document',
    image: 'Image',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    tweet: 'Tweet',
    x: 'X',
    github: 'GitHub',
  };

  return labels[normalizedType] || 'Node';
}

export default NodeDetailsPanel;
