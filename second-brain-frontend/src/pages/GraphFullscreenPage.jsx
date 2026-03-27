import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Minimize2, RefreshCcw, Search, SearchX, Share2, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GraphCanvas from '../features/graph/components/GraphCanvas';
import NodeDetailsPanel from '../features/graph/components/NodeDetailsPanel';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import Input from '../components/ui/Input';
import { useGetContent } from '../hooks/useContent';
import { getGraphData } from '../redux/graphSlice';
import {
  buildGraphRouteSearch,
  enrichGraphNode,
  graphCategories,
  normalizeGraphPayload,
  normalizeSearchQuery,
  resolveGraphCategory,
  resolvePreferredNodeId,
  resolveRelatedNodes,
} from '../features/graph/graphPageUtils';

const GraphFullscreenPage = () => {
  const dispatch = useDispatch();
  const MotionDiv = motion.div;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { nodes, edges, loading, error } = useSelector((state) => state.graph);
  const { items: contentItems } = useSelector((state) => state.content);
  const { getContent } = useGetContent();
  const [selectedCategory, setSelectedCategory] = useState(() => resolveRouteCategory(searchParams.get('category')));
  const [selectedNodeId, setSelectedNodeId] = useState(() => normalizeRouteValue(searchParams.get('node')));
  const [searchQuery, setSearchQuery] = useState(() => normalizeRouteValue(searchParams.get('q')));
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const normalizedSearchQuery = normalizeSearchQuery(deferredSearchQuery);

  useEffect(() => {
    dispatch(getGraphData());

    if (!contentItems.length) {
      getContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    const routeCategory = resolveRouteCategory(searchParams.get('category'));
    const routeNodeId = normalizeRouteValue(searchParams.get('node'));
    const routeSearchQuery = normalizeRouteValue(searchParams.get('q'));

    setSelectedCategory((currentValue) => (currentValue === routeCategory ? currentValue : routeCategory));
    setSelectedNodeId((currentValue) => (currentValue === routeNodeId ? currentValue : routeNodeId));
    setSearchQuery((currentValue) => (currentValue === routeSearchQuery ? currentValue : routeSearchQuery));
  }, [searchParams]);

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

  const normalizedGraph = useMemo(
    () => normalizeGraphPayload({ nodes, edges }),
    [edges, nodes],
  );

  const graphNodes = useMemo(
    () => normalizedGraph.nodes.map((node) => enrichGraphNode(node, contentById.get(node.id))),
    [contentById, normalizedGraph.nodes],
  );

  const visibleNodes = useMemo(
    () => graphNodes.filter((node) => (
      selectedCategory === 'All' || resolveGraphCategory(node) === selectedCategory
    )),
    [graphNodes, selectedCategory],
  );

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((node) => node.id)),
    [visibleNodes],
  );

  const visibleEdges = useMemo(
    () => normalizedGraph.edges.filter((edge) => (
      visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    )),
    [normalizedGraph.edges, visibleNodeIds],
  );

  const searchMatches = useMemo(() => {
    if (!normalizedSearchQuery) {
      return [];
    }

    return graphNodes.filter((node) => (
      String(node?.title || '').toLowerCase().includes(normalizedSearchQuery)
    ));
  }, [graphNodes, normalizedSearchQuery]);

  const highlightedNodeId = normalizedSearchQuery ? String(searchMatches[0]?.id || '') : '';

  useEffect(() => {
    if (!visibleNodes.length) {
      setSelectedNodeId('');
      return;
    }

    const hasSelectedNode = visibleNodes.some((node) => node.id === selectedNodeId);

    if (!hasSelectedNode) {
      setSelectedNodeId(resolvePreferredNodeId(visibleNodes, visibleEdges));
    }
  }, [selectedNodeId, visibleEdges, visibleNodes]);

  useEffect(() => {
    if (highlightedNodeId && !visibleNodeIds.has(highlightedNodeId)) {
      setSelectedCategory('All');
    }
  }, [highlightedNodeId, visibleNodeIds]);

  useEffect(() => {
    if (!highlightedNodeId || highlightedNodeId === selectedNodeId) {
      return;
    }

    setSelectedNodeId(highlightedNodeId);
  }, [highlightedNodeId, selectedNodeId]);

  const selectedNode = useMemo(
    () => visibleNodes.find((node) => node.id === selectedNodeId) || null,
    [selectedNodeId, visibleNodes],
  );

  const selectedContent = selectedNode ? contentById.get(selectedNode.id) || null : null;

  const relatedNodes = useMemo(
    () => resolveRelatedNodes({
      edges: visibleEdges,
      nodes: visibleNodes,
      selectedNode,
    }),
    [selectedNode, visibleEdges, visibleNodes],
  );

  const strongestRelation = relatedNodes.length ? relatedNodes[0].weight : null;
  const hasInitialLoadingState = loading && !normalizedGraph.nodes.length;
  const hasNoGraph = !loading && !error && !normalizedGraph.nodes.length;
  const hasNoMatches = !loading && !error && normalizedGraph.nodes.length > 0 && !visibleNodes.length;
  const searchSummary = normalizedSearchQuery
    ? searchMatches.length
      ? `Focused on ${searchMatches[0].title}`
      : `No nodes found for "${searchQuery.trim()}"`
    : `${visibleNodes.length} nodes ready to explore`;

  const graphRouteSearch = useMemo(
    () => buildGraphRouteSearch({
      category: selectedCategory,
      nodeId: selectedNodeId,
      searchQuery,
    }),
    [searchQuery, selectedCategory, selectedNodeId],
  );

  const graphRouteSearchString = graphRouteSearch.toString();
  const currentRouteSearchString = searchParams.toString();

  useEffect(() => {
    if (graphRouteSearchString === currentRouteSearchString) {
      return;
    }

    setSearchParams(graphRouteSearch, { replace: true });
  }, [currentRouteSearchString, graphRouteSearch, graphRouteSearchString, setSearchParams]);

  const handleExitFullscreen = () => {
    navigate({
      pathname: '/graph',
      search: graphRouteSearchString ? `?${graphRouteSearchString}` : '',
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-obsidian-900 text-obsidian-300">
      <div className="pointer-events-none fixed inset-0 bg-obsidian-glow opacity-90" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(255,179,62,0.08),_transparent_28%)]" />

      <div className="relative px-4 py-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="mx-auto max-w-[1760px]">
          <MotionDiv
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="sticky top-4 z-20"
          >
            <GlassCard className="overflow-hidden px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="surface"
                    className="rounded-2xl px-4 py-3"
                    leadingIcon={<ArrowLeft className="h-4 w-4" />}
                    onClick={handleExitFullscreen}
                  >
                    Back To Graph
                  </Button>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent-soft">Immersive Mode</p>
                    <h1 className="mt-1 text-xl font-bold text-[#fff1d5]">Dedicated graph workspace with persistent details</h1>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-full border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.02)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-obsidian-500">
                    {visibleNodes.length} nodes • {visibleEdges.length} links
                  </div>
                  <Button
                    type="button"
                    variant="amber"
                    className="rounded-2xl px-5 py-3"
                    leadingIcon={<Minimize2 className="h-4 w-4" />}
                    onClick={handleExitFullscreen}
                  >
                    Exit Full Screen
                  </Button>
                </div>
              </div>
            </GlassCard>
          </MotionDiv>

          <section className="mt-6 flex flex-col gap-6">
            <MotionDiv
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"
            >
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.02)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-accent-soft">
                  <Share2 className="h-3.5 w-3.5 text-accent" />
                  Full Graph
                </div>

                <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-end md:gap-4">
                  <h2 className="text-[2rem] font-extrabold leading-tight text-[#fff1d5] sm:text-[2.35rem]">
                    Full Graph Explorer
                  </h2>
                  <p className="pb-1 text-sm text-obsidian-500">
                    showing {visibleNodes.length} of {normalizedGraph.nodes.length} nodes
                  </p>
                </div>

                <p className="mt-3 max-w-4xl text-sm leading-7 text-obsidian-400">
                  Use the dedicated graph studio to inspect relationships, keep the details panel visible, and move through your archive without leaving the canvas.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto xl:min-w-[38rem] xl:items-center xl:justify-end">
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search and focus a node by title..."
                  icon={Search}
                  className="w-full xl:max-w-[24rem]"
                  rightSlot={searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-obsidian-500 transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-obsidian-300"
                      aria-label="Clear graph search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                />
                <Button
                  type="button"
                  variant="surface"
                  className="rounded-2xl px-5 py-3"
                  leadingIcon={<RefreshCcw className="h-4 w-4" />}
                  loading={loading && !!normalizedGraph.nodes.length}
                  onClick={() => dispatch(getGraphData())}
                >
                  Refresh Graph
                </Button>
              </div>
            </MotionDiv>

            <div className="obsidian-scroll flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
              {graphCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                    selectedCategory === category
                      ? 'bg-[rgba(248,174,29,0.14)] text-accent'
                      : 'text-obsidian-500 hover:bg-[rgba(255,255,255,0.04)] hover:text-obsidian-300'
                  }`}
                >
                  {category}
                </button>
              ))}

              <div className="ml-auto hidden rounded-full border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.02)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-obsidian-500 lg:inline-flex">
                {searchSummary}
              </div>
            </div>

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
              <FullscreenGraphLoadingState />
            ) : hasNoGraph ? (
              <FullscreenEmptyState
                title="Your graph is still quiet"
                description="Save a few related links, documents, or images first. Once content-level embeddings accumulate, the semantic relationship map will start forming nodes and edges."
              />
            ) : hasNoMatches ? (
              <FullscreenEmptyState
                title="No nodes match the current category"
                description="Switch the graph category to reveal a wider part of your archive."
              />
            ) : (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.72fr)_minmax(24rem,0.86fr)] xl:items-stretch">
                <GlassCard className="relative h-[min(72vh,56rem)] min-h-[28rem] overflow-hidden p-2 sm:p-3 xl:h-[calc(100dvh-12.75rem)]">
                  <GraphCanvas
                    nodes={visibleNodes}
                    edges={visibleEdges}
                    selectedNodeId={selectedNodeId}
                    highlightedNodeId={highlightedNodeId}
                    onNodeSelect={(node) => {
                      setSelectedNodeId(String(node?.id || ''));
                    }}
                  />
                </GlassCard>

                <MotionDiv
                  key={`fullscreen-${selectedNodeId || 'empty-selection'}`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  className="xl:h-[calc(100dvh-12.75rem)] xl:overflow-hidden"
                >
                  <NodeDetailsPanel
                    node={selectedNode}
                    content={selectedContent}
                    relatedNodes={relatedNodes}
                    relationCount={relatedNodes.length}
                    strongestRelation={strongestRelation}
                    onSelectRelatedNode={(nodeId) => setSelectedNodeId(String(nodeId || ''))}
                    onOpenContent={() => {
                      const destinationUrl = String(selectedContent?.url || '').trim();

                      if (destinationUrl) {
                        window.open(destinationUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                  />
                </MotionDiv>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

function FullscreenGraphLoadingState() {
  return (
    <GlassCard className="overflow-hidden px-6 py-10">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.72fr)_minmax(24rem,0.86fr)]">
        <div className="min-h-[42rem] rounded-[28px] border border-[rgba(255,204,102,0.08)] bg-[linear-gradient(180deg,rgba(23,18,15,0.92),rgba(14,11,9,0.96))] p-6">
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

function FullscreenEmptyState({ title, description }) {
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

function normalizeRouteValue(value) {
  return String(value || '').trim();
}

function resolveRouteCategory(value) {
  const normalizedValue = normalizeRouteValue(value);
  return graphCategories.includes(normalizedValue) ? normalizedValue : 'All';
}

export default GraphFullscreenPage;
