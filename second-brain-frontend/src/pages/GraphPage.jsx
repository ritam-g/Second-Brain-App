import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, SearchX, Share2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import GraphView from '../components/graph/GraphView';
import GraphNode from '../components/graph/GraphNode';
import MainLayout from '../components/layout/MainLayout';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import { useGetContent } from '../hooks/useContent';
import { useLogout } from '../hooks/useAuth';
import { getGraphData } from '../redux/graphSlice';

const graphCategories = ['All', 'Links', 'Documents', 'Images', 'Video', 'Social'];

// Dedicated page for exploring semantic relationships between saved content items.
// Input: graph API data plus optional enriched content metadata from the user's library.
// Output: interactive knowledge-graph workspace with filters, detail panel, and open-content action.
const GraphPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { nodes, edges, loading, error } = useSelector((state) => state.graph);
  const { items: contentItems } = useSelector((state) => state.content);
  const { getContent } = useGetContent();
  const { performLogout, loading: logoutLoading } = useLogout();
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const deferredSearchValue = useDeferredValue(searchValue);

  useEffect(() => {
    dispatch(getGraphData());

    if (!contentItems.length) {
      getContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const contentById = useMemo(() => {
    const entries = new Map();

    contentItems.forEach((item) => {
      const mongoId = String(item?._id || '').trim();
      const contentId = String(item?.contentId || '').trim();

      if (mongoId) {
        entries.set(mongoId, item);
      }

      if (contentId) {
        entries.set(contentId, item);
      }
    });

    return entries;
  }, [contentItems]);

  const filteredNodes = useMemo(() => {
    const normalizedQuery = String(deferredSearchValue || '').trim().toLowerCase();

    return nodes.filter((node) => {
      const normalizedTitle = String(node?.title || '').toLowerCase();
      const normalizedType = String(node?.type || '').toLowerCase();
      const content = contentById.get(String(node?.id || '').trim());
      const normalizedTags = Array.isArray(content?.tags)
        ? content.tags.join(' ').toLowerCase()
        : '';
      const matchesQuery = !normalizedQuery
        || normalizedTitle.includes(normalizedQuery)
        || normalizedType.includes(normalizedQuery)
        || normalizedTags.includes(normalizedQuery);
      const matchesCategory = selectedCategory === 'All' || resolveGraphCategory(node) === selectedCategory;

      return matchesQuery && matchesCategory;
    });
  }, [contentById, deferredSearchValue, nodes, selectedCategory]);

  const filteredNodeIds = useMemo(
    () => new Set(filteredNodes.map((node) => String(node?.id || '').trim()).filter(Boolean)),
    [filteredNodes],
  );

  const filteredEdges = useMemo(
    () => edges.filter((edge) => {
      const sourceId = getLinkEndpointId(edge?.source);
      const targetId = getLinkEndpointId(edge?.target);

      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    }),
    [edges, filteredNodeIds],
  );

  useEffect(() => {
    if (!filteredNodes.length) {
      setSelectedNodeId('');
      return;
    }

    const hasSelectedNode = filteredNodes.some((node) => String(node?.id || '') === selectedNodeId);

    if (!hasSelectedNode) {
      setSelectedNodeId(resolvePreferredNodeId(filteredNodes, filteredEdges));
    }
  }, [filteredEdges, filteredNodes, selectedNodeId]);

  const selectedNode = filteredNodes.find((node) => String(node?.id || '') === selectedNodeId) || null;
  const selectedContent = selectedNode ? contentById.get(String(selectedNode.id || '').trim()) || null : null;
  const relatedNodes = useMemo(
    () => resolveRelatedNodes({ selectedNode, nodes: filteredNodes, edges: filteredEdges }),
    [filteredEdges, filteredNodes, selectedNode],
  );
  const strongestRelation = relatedNodes.length ? relatedNodes[0].weight : null;
  const hasInitialLoadingState = loading && !nodes.length;
  const hasNoGraph = !loading && !error && !nodes.length;
  const hasNoMatches = !loading && filteredNodes.length === 0 && nodes.length > 0;

  return (
    <MainLayout
      user={user}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      categories={graphCategories}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      onPrimaryAction={() => dispatch(getGraphData())}
      onLogout={performLogout}
      logoutLoading={logoutLoading}
      searchPlaceholder="Search graph nodes by title, type, or tags..."
      rightMetaLabel={`${filteredNodes.length} nodes | ${filteredEdges.length} links | semantic relationship view`}
    >
      <section className="flex flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.02)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-accent-soft">
              <Share2 className="h-3.5 w-3.5 text-accent" />
              Knowledge Graph
            </div>

            <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-end md:gap-4">
              <h1 className="text-[2.1rem] font-extrabold leading-tight text-[#fff1d5] sm:text-[2.6rem]">
                Semantic Relationship Engine
              </h1>
              <p className="pb-1 text-sm text-obsidian-500">
                showing {filteredNodes.length} of {nodes.length} nodes
              </p>
            </div>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-obsidian-400">
              Explore how documents, saved links, and visual references connect at the content level. Each edge reflects semantic similarity across your Second Brain archive.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="surface"
              className="rounded-2xl px-5 py-3"
              leadingIcon={<RefreshCcw className="h-4 w-4" />}
              loading={loading && !!nodes.length}
              onClick={() => dispatch(getGraphData())}
            >
              Refresh Graph
            </Button>
          </div>
        </motion.div>

        {error ? (
          <GlassCard className="flex flex-col gap-4 px-5 py-4 text-sm text-obsidian-400 sm:flex-row sm:items-center sm:justify-between">
            <p>{typeof error === 'string' ? error : 'The knowledge graph could not be loaded right now.'}</p>
            <Button
              type="button"
              variant="surface"
              className="rounded-2xl px-5 py-3"
              leadingIcon={<RefreshCcw className="h-4 w-4" />}
              onClick={() => dispatch(getGraphData())}
            >
              Retry
            </Button>
          </GlassCard>
        ) : null}

        {hasInitialLoadingState ? (
          <GraphLoadingState />
        ) : hasNoGraph ? (
          <GraphEmptyState
            title="Your graph is still quiet"
            description="Save a few related links, documents, or images first. Once content-level embeddings accumulate, the semantic relationship map will start forming nodes and edges."
          />
        ) : hasNoMatches ? (
          <GraphEmptyState
            title="No nodes match the current filters"
            description="Try a broader search term or switch the graph category to reveal a wider part of your archive."
          />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(22rem,0.72fr)]">
            <GlassCard className="relative min-h-[40rem] overflow-hidden p-2">
              <GraphView
                nodes={filteredNodes}
                edges={filteredEdges}
                selectedNodeId={selectedNodeId}
                onNodeSelect={(node) => setSelectedNodeId(String(node?.id || ''))}
              />
            </GlassCard>

            <motion.div
              key={selectedNodeId || 'empty-selection'}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <GraphNode
                node={selectedNode}
                content={selectedContent}
                relatedNodes={relatedNodes}
                relationCount={relatedNodes.length}
                strongestRelation={strongestRelation}
                onOpenContent={() => {
                  const destinationUrl = String(selectedContent?.url || '').trim();

                  if (destinationUrl) {
                    window.open(destinationUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
              />
            </motion.div>
          </div>
        )}
      </section>
    </MainLayout>
  );
};

function GraphLoadingState() {
  return (
    <GlassCard className="overflow-hidden px-6 py-10">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(22rem,0.72fr)]">
        <div className="min-h-[36rem] rounded-[28px] border border-[rgba(255,204,102,0.08)] bg-[linear-gradient(180deg,rgba(23,18,15,0.92),rgba(14,11,9,0.96))] p-6">
          <div className="h-full animate-pulse rounded-[24px] bg-[radial-gradient(circle_at_top,_rgba(103,232,249,0.08),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(248,174,29,0.1),_transparent_28%),rgba(255,255,255,0.02)]" />
        </div>
        <div className="space-y-4">
          <div className="h-64 animate-pulse rounded-[28px] border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)]" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-28 animate-pulse rounded-[24px] border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)]" />
            <div className="h-28 animate-pulse rounded-[24px] border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)]" />
            <div className="h-28 animate-pulse rounded-[24px] border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)]" />
            <div className="h-28 animate-pulse rounded-[24px] border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)]" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function GraphEmptyState({ title, description }) {
  return (
    <GlassCard className="mx-auto max-w-3xl px-6 py-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[rgba(248,174,29,0.12)] text-accent">
        <SearchX className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-2xl font-bold text-[#fff1d5]">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-obsidian-400">{description}</p>
    </GlassCard>
  );
}

function resolveGraphCategory(node) {
  const normalizedType = String(node?.type || '').toLowerCase();

  if (normalizedType === 'pdf' || normalizedType === 'document') {
    return 'Documents';
  }

  if (normalizedType === 'image') {
    return 'Images';
  }

  if (normalizedType === 'youtube' || normalizedType === 'video') {
    return 'Video';
  }

  if (['tweet', 'x', 'linkedin', 'instagram'].includes(normalizedType)) {
    return 'Social';
  }

  return 'Links';
}

function resolvePreferredNodeId(nodes, edges) {
  const scores = new Map();

  edges.forEach((edge) => {
    const sourceId = getLinkEndpointId(edge?.source);
    const targetId = getLinkEndpointId(edge?.target);
    const weight = Number(edge?.weight) || 0;

    if (sourceId) {
      scores.set(sourceId, (scores.get(sourceId) || 0) + weight + 1);
    }

    if (targetId) {
      scores.set(targetId, (scores.get(targetId) || 0) + weight + 1);
    }
  });

  let preferredNode = nodes[0] || null;
  let preferredScore = preferredNode ? scores.get(String(preferredNode.id || '')) || 0 : -1;

  nodes.forEach((node) => {
    const nodeId = String(node?.id || '');
    const nextScore = scores.get(nodeId) || 0;

    if (nextScore > preferredScore) {
      preferredNode = node;
      preferredScore = nextScore;
    }
  });

  return String(preferredNode?.id || '');
}

function resolveRelatedNodes({ selectedNode, nodes, edges }) {
  if (!selectedNode) {
    return [];
  }

  const nodesById = new Map(
    nodes.map((node) => [String(node?.id || ''), node]),
  );
  const selectedNodeId = String(selectedNode.id || '');
  const relationships = [];

  edges.forEach((edge) => {
    const sourceId = getLinkEndpointId(edge?.source);
    const targetId = getLinkEndpointId(edge?.target);
    const weight = Number(edge?.weight) || 0;

    if (sourceId !== selectedNodeId && targetId !== selectedNodeId) {
      return;
    }

    const relatedId = sourceId === selectedNodeId ? targetId : sourceId;
    const relatedNode = nodesById.get(relatedId);

    if (!relatedNode) {
      return;
    }

    relationships.push({
      id: String(relatedNode.id || ''),
      title: String(relatedNode.title || 'Untitled Content'),
      type: String(relatedNode.type || ''),
      weight,
      weightLabel: `${Math.round(Math.max(0, Math.min(1, weight)) * 100)}%`,
    });
  });

  return relationships.sort((a, b) => b.weight - a.weight);
}

function getLinkEndpointId(endpoint) {
  if (typeof endpoint === 'object' && endpoint !== null) {
    return String(endpoint.id || '');
  }

  return String(endpoint || '');
}

export default GraphPage;
