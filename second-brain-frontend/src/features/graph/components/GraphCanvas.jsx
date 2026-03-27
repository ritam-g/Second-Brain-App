import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

const typePalette = {
  article: '#f5be6a',
  youtube: '#ff8f80',
  video: '#7fe2cf',
  pdf: '#84d8ff',
  document: '#c9b6ff',
  image: '#ffb7d6',
  linkedin: '#8cbfff',
  instagram: '#ffb694',
  tweet: '#aeb6ff',
  x: '#8be0d2',
  github: '#cfd3da',
};

const NODE_RADIUS = 22;
const AVATAR_RADIUS = 18;

/**
 * GraphCanvas Component
 * Responsibility: renders the interactive D3 scene for graph exploration.
 * Handles: force layout, zoom/drag behavior, rich node styling, and hover/selection feedback.
 */
const GraphCanvas = ({
  nodes = [],
  edges = [],
  selectedNodeId = '',
  highlightedNodeId = '',
  onNodeSelect,
}) => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const sceneRef = useRef(null);
  const nodeLayoutRef = useRef(new Map());
  const transformRef = useRef(d3.zoomIdentity);
  const onNodeSelectRef = useRef(onNodeSelect);
  const selectedNodeIdRef = useRef(selectedNodeId);
  const highlightedNodeIdRef = useRef(highlightedNodeId);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const graphData = useMemo(() => buildGraphData(nodes, edges), [nodes, edges]);

  onNodeSelectRef.current = onNodeSelect;
  selectedNodeIdRef.current = selectedNodeId;
  highlightedNodeIdRef.current = highlightedNodeId;

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const element = containerRef.current;
    const updateDimensions = () => {
      setDimensions({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    updateDimensions();

    const observer = new ResizeObserver(() => {
      updateDimensions();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    setHoveredNode((currentNode) => {
      if (!currentNode) {
        return null;
      }

      return graphData.nodes.find((node) => node.id === currentNode.id) || null;
    });
  }, [graphData]);

  useEffect(() => {
    if (!svgRef.current || dimensions.width <= 0 || dimensions.height <= 0) {
      return undefined;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const simulationNodes = graphData.nodes.map((node) => applyStoredNodeLayout({ ...node }, nodeLayoutRef.current.get(node.id)));
    const simulationLinks = graphData.links.map((link) => ({ ...link }));
    const hasPersistedLayout = simulationNodes.every((node) => hasStoredNodePosition(nodeLayoutRef.current.get(node.id)));
    const defs = svg.append('defs');
    appendNodeDefinitions(defs, simulationNodes);

    const root = svg.append('g');
    const linksLayer = root.append('g').attr('class', 'graph-links debug-graph-links').attr('data-debug', 'graph-links');
    const nodesLayer = root.append('g').attr('class', 'graph-nodes debug-graph-nodes').attr('data-debug', 'graph-nodes');

    const linkSelection = linksLayer
      .selectAll('path')
      .data(simulationLinks, (link) => link.id)
      .join('path')
      .attr('class', 'graph-link debug-graph-link')
      .attr('data-debug', 'graph-link')
      .attr('data-source-id', (link) => getLinkEndpointId(link.source))
      .attr('data-target-id', (link) => getLinkEndpointId(link.target))
      .attr('fill', 'none')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round');

    const nodeSelection = nodesLayer
      .selectAll('g')
      .data(simulationNodes, (node) => node.id)
      .join('g')
      .attr('class', 'graph-node debug-graph-node')
      .attr('data-debug', 'graph-node')
      .attr('data-node-id', (node) => node.id)
      .attr('data-node-type', (node) => node.type)
      .style('cursor', 'grab')
      .style('pointer-events', 'all');

    const visualSelection = nodeSelection
      .append('g')
      .attr('class', 'graph-node-visual debug-graph-node-visual')
      .attr('data-debug', 'graph-node-visual')
      .style('transform-origin', 'center')
      .style('transition', 'transform 220ms ease, opacity 220ms ease, filter 220ms ease');

    visualSelection.append('circle').attr('class', 'graph-node-glow debug-graph-node-glow');
    visualSelection.append('circle').attr('class', 'graph-node-halo debug-graph-node-halo');
    visualSelection.append('circle').attr('class', 'graph-node-ring debug-graph-node-ring');
    visualSelection.append('circle').attr('class', 'graph-node-shell debug-graph-node-shell');
    visualSelection.append('circle').attr('class', 'graph-node-avatar-backdrop debug-graph-node-avatar-backdrop');
    visualSelection.append('text').attr('class', 'graph-node-fallback debug-graph-node-fallback');
    visualSelection.append('image').attr('class', 'graph-node-image debug-graph-node-image');
    visualSelection.append('circle').attr('class', 'graph-node-avatar-ring debug-graph-node-avatar-ring');
    visualSelection.append('circle').attr('class', 'graph-node-sheen debug-graph-node-sheen');

    visualSelection
      .select('.graph-node-glow')
      .attr('r', 30)
      .attr('fill', (node) => resolveNodeColor(node.type));

    visualSelection
      .select('.graph-node-halo')
      .attr('r', 26)
      .attr('fill', (node) => resolveNodeColor(node.type));

    visualSelection
      .select('.graph-node-ring')
      .attr('r', 24)
      .attr('fill', 'rgba(12, 14, 19, 0.88)');

    visualSelection
      .select('.graph-node-shell')
      .attr('r', NODE_RADIUS)
      .attr('fill', 'rgba(17, 22, 28, 0.96)')
      .attr('stroke', 'rgba(255,255,255,0.12)')
      .attr('stroke-width', 1.5);

    visualSelection
      .select('.graph-node-avatar-backdrop')
      .attr('r', AVATAR_RADIUS)
      .attr('fill', (node) => d3.color(resolveNodeColor(node.type))?.copy({ opacity: 0.22 })?.formatRgb() || 'rgba(255,255,255,0.12)');

    visualSelection
      .select('.graph-node-fallback')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', 12)
      .attr('font-weight', 800)
      .attr('fill', '#fef4df')
      .text((node) => node.initials);

    visualSelection
      .select('.graph-node-image')
      .attr('x', -AVATAR_RADIUS)
      .attr('y', -AVATAR_RADIUS)
      .attr('width', AVATAR_RADIUS * 2)
      .attr('height', AVATAR_RADIUS * 2)
      .attr('preserveAspectRatio', 'xMidYMid slice')
      .attr('clip-path', (node) => `url(#graph-node-clip-${escapeNodeId(node.id)})`)
      .attr('href', (node) => node.image || null)
      .attr('opacity', (node) => (node.image ? 1 : 0));

    visualSelection
      .select('.graph-node-avatar-ring')
      .attr('r', AVATAR_RADIUS + 1)
      .attr('fill', 'transparent')
      .attr('stroke', 'rgba(255,255,255,0.1)')
      .attr('stroke-width', 1);

    visualSelection
      .select('.graph-node-sheen')
      .attr('cx', -6)
      .attr('cy', -11)
      .attr('r', 8)
      .attr('fill', 'rgba(255,255,255,0.12)');

    const labelSelection = nodeSelection
      .append('g')
      .attr('class', 'graph-node-label debug-graph-node-label')
      .attr('data-debug', 'graph-node-label')
      .style('transform-origin', 'center')
      .style('transition', 'transform 220ms ease, opacity 220ms ease');

    labelSelection
      .append('rect')
      .attr('class', 'graph-node-label-bg debug-graph-node-label-bg')
      .attr('x', (node) => -(node.labelWidth / 2))
      .attr('y', NODE_RADIUS + 16)
      .attr('width', (node) => node.labelWidth)
      .attr('height', (node) => node.labelHeight)
      .attr('rx', 14)
      .attr('ry', 14)
      .attr('stroke-width', 1);

    labelSelection
      .append('text')
      .attr('class', 'graph-node-title debug-graph-node-title')
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff6e6')
      .attr('font-size', 11)
      .attr('font-weight', 700)
      .each(function appendLabel(node) {
        const textSelection = d3.select(this);

        node.titleLines.forEach((line, index) => {
          textSelection
            .append('tspan')
            .attr('x', 0)
            .attr('y', NODE_RADIUS + 34 + (index * 13))
            .text(line);
        });
      });

    const zoomBehavior = d3
      .zoom()
      .scaleExtent([0.45, 4])
      .filter(resolveZoomFilter)
      .on('zoom', (event) => {
        root.attr('transform', event.transform);
        transformRef.current = event.transform;

        if (sceneRef.current) {
          sceneRef.current.transform = event.transform;
        }
      });

    svg
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .attr('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`)
      .style('touch-action', 'none')
      .call(zoomBehavior)
      .on('dblclick.zoom', null)
      .on('click', () => {
        setHoveredNode(null);
      });

    const simulation = d3
      .forceSimulation(simulationNodes)

      // ✅ smarter links (based on similarity weight)
      .force(
        'link',
        d3
          .forceLink(simulationLinks)
          .id((d) => d.id)
          .distance((link) => 180 - (link.weight * 80)) // 🔥 dynamic distance
          .strength(0.7)
      )

      // ✅ strong repulsion → spreads nodes
      .force(
        'charge',
        d3.forceManyBody().strength(resolveChargeStrength(simulationNodes.length))
      )

      // ✅ soft centering (not forcing too hard)
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))

      // ✅ smooth gravity instead of tight pulling
      .force('x', d3.forceX(dimensions.width / 2).strength(0.05))
      .force('y', d3.forceY(dimensions.height / 2).strength(0.05))

      // ✅ BIG collision radius (important)
      .force(
        'collision',
        d3.forceCollide().radius(NODE_RADIUS + 30).strength(0.9)
      )

      // ❌ REMOVE HARD BOUND (very important)
      // .force('bound', ...) ← DELETE THIS

      .alpha(1)
      .alphaDecay(0.03);

    const renderSceneFrame = () => {
      constrainSimulationNodes(simulationNodes, dimensions);
      syncStoredNodeLayout(nodeLayoutRef.current, simulationNodes);
      linkSelection.attr('d', (link) => resolveLinkPath(link));
      nodeSelection.attr('transform', (node) => `translate(${node.x},${node.y})`);
    };

    const dragBehavior = d3
      .drag()
      .on('start', function onStart(event, node) {
        event.sourceEvent?.stopPropagation?.();
        d3.select(this).raise().style('cursor', 'grabbing');

        if (!event.active) {
          simulation.alphaTarget(0.15).restart();
        }

        node.fx = node.x;
        node.fy = node.y;
      })
      .on('drag', function onDrag(event, node) {
        node.fx = clamp(event.x, node.labelWidth / 2, dimensions.width - (node.labelWidth / 2));
        node.fy = clamp(event.y, NODE_RADIUS + 22, dimensions.height - node.labelHeight - NODE_RADIUS - 16);

        setTooltipPosition(resolveTooltipPosition(event, containerRef.current));
      })
      .on('end', function onEnd(event, node) {
        if (!event.active) {
          simulation.alphaTarget(0);
        }

        node.fx = node.x;
        node.fy = node.y;
        d3.select(this).style('cursor', 'grab');
      });

    nodeSelection
      .call(dragBehavior)
      .on('mouseenter', function onEnter(event, node) {
        d3.select(this).raise();
        setHoveredNode(buildTooltipNode(node));
        setTooltipPosition(resolveTooltipPosition(event, containerRef.current));
      })
      .on('mousemove', (event, node) => {
        setHoveredNode((currentNode) => (currentNode?.id === node.id ? currentNode : buildTooltipNode(node)));
        setTooltipPosition(resolveTooltipPosition(event, containerRef.current));
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
      })
      .on('click', (event, node) => {
        event.stopPropagation();
        setHoveredNode(buildTooltipNode(node));
        setTooltipPosition(resolveTooltipPosition(event, containerRef.current));
        onNodeSelectRef.current?.(buildTooltipNode(node));

        if (sceneRef.current) {
          sceneRef.current.lastFocusedKey = '';
          focusSceneNode({
            scene: sceneRef.current,
            nodeId: node.id,
            dimensions,
          });
        }
      });

    simulation.stop();

    if (!hasPersistedLayout) {
      const initialTickCount = Math.min(96, Math.max(28, simulationNodes.length * 4));

      for (let index = 0; index < initialTickCount; index += 1) {
        simulation.tick();
      }
    }

    renderSceneFrame();
    simulation.on('tick', renderSceneFrame);

    sceneRef.current = {
      linkSelection,
      nodeSelection,
      simulation,
      svg,
      zoomBehavior,
      transform: d3.zoomIdentity,
      nodes: simulationNodes,
      links: simulationLinks,
      lastFocusedKey: '',
      lastCenteredKey: '',
    };

    applySceneStyles(sceneRef.current, {
      hoveredNodeId: '',
      selectedNodeId: selectedNodeIdRef.current,
      highlightedNodeId: highlightedNodeIdRef.current,
    });

    const initialFocusNodeId = highlightedNodeIdRef.current || selectedNodeIdRef.current;

    if (initialFocusNodeId) {
      focusSceneNode({
        scene: sceneRef.current,
        nodeId: initialFocusNodeId,
        dimensions,
      });
    } else if (hasPersistedLayout) {
      centerScene({
        scene: sceneRef.current,
        transform: transformRef.current,
        animate: false,
      });
    } else {
      centerGraphScene({
        scene: sceneRef.current,
        dimensions,
      });
    }

    if (hasPersistedLayout) {
      simulation.alpha(0);
    } else {
      simulation.alpha(0.28).restart();
    }

    return () => {
      simulation.stop();
      svg.on('.zoom', null);
      sceneRef.current = null;
    };
  }, [dimensions, graphData]);

  useEffect(() => {
    applySceneStyles(sceneRef.current, {
      hoveredNodeId: hoveredNode?.id || '',
      selectedNodeId,
      highlightedNodeId,
    });
  }, [hoveredNode, selectedNodeId, highlightedNodeId]);

  useEffect(() => {
    const focusNodeId = highlightedNodeId || selectedNodeId;

    if (focusNodeId) {
      focusSceneNode({
        scene: sceneRef.current,
        nodeId: focusNodeId,
        dimensions,
      });
      return;
    }

    if (sceneRef.current?.nodes?.length) {
      centerScene({
        scene: sceneRef.current,
        transform: transformRef.current,
        animate: false,
      });
    }
  }, [dimensions, highlightedNodeId, selectedNodeId, graphData.nodes.length]);

  return (
    <div
      ref={containerRef}
      className="graph-canvas debug-graph-canvas relative h-full min-h-[24rem] w-full overflow-hidden rounded-[28px]"
      data-debug="graph-canvas"
      data-node-count={graphData.nodes.length}
      data-link-count={graphData.links.length}
      data-selected-node={selectedNodeId || ''}
      data-highlighted-node={highlightedNodeId || ''}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(132,216,255,0.12),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(245,190,106,0.1),_transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-55 [background-image:radial-gradient(circle,rgba(166,224,255,0.16)_1px,transparent_1px)] [background-position:0_0] [background-size:2.8rem_2.8rem]" />

      <div className="graph-legend debug-graph-legend pointer-events-none absolute left-4 top-4 z-10 flex max-w-[75%] flex-wrap gap-2 sm:left-5 sm:top-5" data-debug="graph-legend">
        {resolveLegendItems(graphData.nodes).map((item) => (
          <div
            key={item.type}
            className="graph-legend-item debug-graph-legend-item inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(14,11,9,0.74)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-obsidian-400 backdrop-blur-xl"
            data-debug="graph-legend-item"
            data-type={item.type}
          >
            <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_14px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
            {item.label}
          </div>
        ))}
      </div>

      <svg
        ref={svgRef}
        className="graph-canvas-surface debug-graph-canvas-surface relative z-[1] block h-full w-full touch-none"
        role="img"
        aria-label="Knowledge graph canvas"
        data-debug="graph-canvas-surface"
      />

      {hoveredNode ? (
        <div
          className="graph-tooltip debug-graph-tooltip pointer-events-none absolute z-20 max-w-[16rem] rounded-[20px] border border-[rgba(255,255,255,0.1)] bg-[rgba(14,11,9,0.92)] px-4 py-3 shadow-[0_18px_35px_rgba(0,0,0,0.28)] backdrop-blur-xl"
          data-debug="graph-tooltip"
          data-node-id={hoveredNode.id}
          data-node-type={hoveredNode.type}
          style={{
            left: `${clamp(tooltipPosition.x + 18, 16, Math.max(16, dimensions.width - 286))}px`,
            top: `${clamp(tooltipPosition.y + 18, 16, Math.max(16, dimensions.height - 116))}px`,
          }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-soft">{formatTypeLabel(hoveredNode.type)}</p>
          <h4 className="mt-2 text-sm font-bold leading-6 text-[#fff2d7]">{hoveredNode.title}</h4>
        </div>
      ) : null}

      {!graphData.links.length && graphData.nodes.length ? (
        <div
          className="graph-empty-links-hint debug-graph-empty-links-hint pointer-events-none absolute bottom-4 left-4 z-10 rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(14,11,9,0.76)] px-4 py-3 text-xs leading-6 text-obsidian-400 backdrop-blur-xl sm:bottom-5 sm:left-5"
          data-debug="graph-empty-links-hint"
        >
          Semantic links will appear here once more saved content crosses the similarity threshold.
        </div>
      ) : null}
    </div>
  );
};

function buildGraphData(nodes, edges) {
  const nodesById = new Map();

  (Array.isArray(nodes) ? nodes : []).forEach((node) => {
    const normalizedNode = normalizeNode(node);

    if (!normalizedNode || nodesById.has(normalizedNode.id)) {
      return;
    }

    nodesById.set(normalizedNode.id, normalizedNode);
  });

  const linksById = new Map();

  (Array.isArray(edges) ? edges : []).forEach((edge) => {
    const sourceId = getLinkEndpointId(edge?.source);
    const targetId = getLinkEndpointId(edge?.target);

    if (!sourceId || !targetId || sourceId === targetId) {
      return;
    }

    if (!nodesById.has(sourceId) || !nodesById.has(targetId)) {
      return;
    }

    const [firstId, secondId] = sourceId < targetId
      ? [sourceId, targetId]
      : [targetId, sourceId];
    const linkId = `${firstId}::${secondId}`;
    const weight = clamp(Number(edge?.weight) || 0, 0, 1);
    const existingLink = linksById.get(linkId);

    if (!existingLink || weight > existingLink.weight) {
      linksById.set(linkId, {
        id: linkId,
        source: sourceId,
        target: targetId,
        weight,
      });
    }
  });

  return {
    nodes: Array.from(nodesById.values()),
    links: Array.from(linksById.values()),
  };
}

function normalizeNode(node) {
  const id = String(node?.id || '').trim();

  if (!id) {
    return null;
  }

  const title = String(node?.title || 'Untitled Content').trim() || 'Untitled Content';
  const titleLines = splitTitleLines(title, 16, 2);
  const longestLine = Math.max(...titleLines.map((line) => line.length), 8);

  return {
    id,
    title,
    image: String(node?.image || '').trim(),
    type: String(node?.type || 'document').trim() || 'document',
    initials: getNodeInitials(title),
    titleLines,
    labelWidth: clamp(longestLine * 7.4 + 28, 86, 156),
    labelHeight: titleLines.length > 1 ? 44 : 32,
  };
}

function buildTooltipNode(node) {
  return {
    id: String(node?.id || '').trim(),
    title: String(node?.title || 'Untitled Content').trim() || 'Untitled Content',
    image: String(node?.image || '').trim(),
    type: String(node?.type || 'document').trim() || 'document',
  };
}

function applyStoredNodeLayout(node, storedLayout) {
  if (!storedLayout) {
    return node;
  }

  return {
    ...node,
    x: storedLayout.x,
    y: storedLayout.y,
    fx: storedLayout.fx,
    fy: storedLayout.fy,
  };
}

function hasStoredNodePosition(storedLayout) {
  return Number.isFinite(storedLayout?.x) && Number.isFinite(storedLayout?.y);
}

function appendNodeDefinitions(defs, nodes) {
  const clipPaths = defs
    .selectAll('clipPath')
    .data(nodes, (node) => node.id)
    .join('clipPath')
    .attr('id', (node) => `graph-node-clip-${escapeNodeId(node.id)}`);

  clipPaths
    .append('circle')
    .attr('r', AVATAR_RADIUS)
    .attr('cx', 0)
    .attr('cy', 0);
}

function applySceneStyles(scene, { hoveredNodeId, selectedNodeId, highlightedNodeId }) {
  if (!scene?.nodeSelection || !scene?.linkSelection) {
    return;
  }

  const activeNodeId = hoveredNodeId || highlightedNodeId || selectedNodeId;
  const connectedNodeIds = buildConnectedNodeSet(scene.links, activeNodeId);

  scene.linkSelection
    .attr('stroke', (link) => resolveLinkColor(link, activeNodeId, highlightedNodeId))
    .attr('stroke-opacity', (link) => resolveLinkOpacity(link, activeNodeId))
    .attr('stroke-width', (link) => resolveLinkWidth(link, activeNodeId, highlightedNodeId));

  scene.nodeSelection
    .attr('opacity', (node) => resolveNodeOpacity(node.id, activeNodeId, connectedNodeIds))
    .select('.graph-node-visual')
    .style('transform', (node) => `scale(${resolveNodeScale(node.id, hoveredNodeId, selectedNodeId, highlightedNodeId, connectedNodeIds)})`)
    .style('filter', (node) => resolveNodeFilter(node.id, hoveredNodeId, selectedNodeId, highlightedNodeId, connectedNodeIds));

  scene.nodeSelection
    .select('.graph-node-glow')
    .attr('fill-opacity', (node) => resolveGlowOpacity(node.id, hoveredNodeId, selectedNodeId, highlightedNodeId))
    .attr('r', (node) => resolveGlowRadius(node.id, hoveredNodeId, selectedNodeId, highlightedNodeId));

  scene.nodeSelection
    .select('.graph-node-halo')
    .attr('fill-opacity', (node) => resolveHaloOpacity(node.id, hoveredNodeId, selectedNodeId, highlightedNodeId));

  scene.nodeSelection
    .select('.graph-node-ring')
    .attr('stroke', (node) => resolveRingStroke(node.id, hoveredNodeId, selectedNodeId, highlightedNodeId))
    .attr('stroke-width', (node) => resolveRingWidth(node.id, hoveredNodeId, selectedNodeId, highlightedNodeId));

  scene.nodeSelection
    .select('.graph-node-shell')
    .attr('stroke', (node) => resolveShellStroke(node.id, hoveredNodeId, selectedNodeId, highlightedNodeId))
    .attr('fill', (node) => resolveShellFill(node.id, activeNodeId, connectedNodeIds));

  scene.nodeSelection
    .select('.graph-node-avatar-ring')
    .attr('stroke', (node) => resolveAvatarRingStroke(node.id, hoveredNodeId, selectedNodeId, highlightedNodeId));

  scene.nodeSelection
    .select('.graph-node-label')
    .style('transform', (node) => `scale(${resolveLabelScale(node.id, hoveredNodeId, selectedNodeId, highlightedNodeId)})`);

  scene.nodeSelection
    .select('.graph-node-label-bg')
    .attr('fill', (node) => resolveLabelFill(node.id, activeNodeId, connectedNodeIds))
    .attr('stroke', (node) => resolveLabelStroke(node.id, hoveredNodeId, selectedNodeId, highlightedNodeId));

  scene.nodeSelection
    .select('.graph-node-title')
    .attr('fill', (node) => resolveTitleColor(node.id, activeNodeId, connectedNodeIds));
}

function centerGraphScene({ scene, dimensions }) {
  if (!scene || dimensions.width <= 0 || dimensions.height <= 0 || !scene.nodes?.length) {
    return;
  }

  const bounds = resolveSceneBounds(scene.nodes);

  if (!bounds) {
    return;
  }

  const padding = Math.max(32, Math.min(dimensions.width, dimensions.height) * 0.08);
  const availableWidth = Math.max(1, dimensions.width - (padding * 2));
  const availableHeight = Math.max(1, dimensions.height - (padding * 2));
  const nextScale = clamp(
    Math.min(1, availableWidth / bounds.width, availableHeight / bounds.height),
    0.58,
    1,
  );
  const targetTransform = d3.zoomIdentity
    .translate((dimensions.width / 2) - (bounds.centerX * nextScale), (dimensions.height / 2) - (bounds.centerY * nextScale))
    .scale(nextScale);
  const centerKey = `${dimensions.width}x${dimensions.height}:${Math.round(bounds.width)}x${Math.round(bounds.height)}:${nextScale.toFixed(3)}`;

  if (scene.lastCenteredKey === centerKey) {
    return;
  }

  scene.lastCenteredKey = centerKey;
  scene.lastFocusedKey = '';

  centerScene({
    scene,
    transform: targetTransform,
    animate: false,
  });
}

function focusSceneNode({ scene, nodeId, dimensions }) {
  if (!scene || !nodeId || dimensions.width <= 0 || dimensions.height <= 0) {
    return;
  }

  const focusKey = `${nodeId}:${dimensions.width}x${dimensions.height}`;

  if (scene.lastFocusedKey === focusKey) {
    return;
  }

  const node = scene.nodes.find((candidate) => candidate.id === nodeId);

  if (!Number.isFinite(node?.x) || !Number.isFinite(node?.y)) {
    return;
  }

  scene.lastFocusedKey = focusKey;
  scene.lastCenteredKey = '';

  focusNode({
    dimensions,
    node,
    svg: scene.svg,
    zoomBehavior: scene.zoomBehavior,
  });
}

function focusNode({ dimensions, node, svg, zoomBehavior }) {
  if (!Number.isFinite(node?.x) || !Number.isFinite(node?.y)) {
    return;
  }

  const scale = 1.38;
  const translateX = (dimensions.width / 2) - (node.x * scale);
  const translateY = (dimensions.height / 2) - (node.y * scale);

  svg
    .transition()
    .duration(520)
    .ease(d3.easeCubicOut)
    .call(
      zoomBehavior.transform,
      d3.zoomIdentity.translate(translateX, translateY).scale(scale),
    );
}

function centerScene({ scene, transform, animate = false }) {
  if (!scene?.svg || !scene?.zoomBehavior || !transform) {
    return;
  }

  const normalizedTransform = d3.zoomIdentity
    .translate(transform.x, transform.y)
    .scale(transform.k);

  if (!animate) {
    scene.svg.call(scene.zoomBehavior.transform, normalizedTransform);
    return;
  }

  scene.svg
    .transition()
    .duration(320)
    .ease(d3.easeCubicOut)
    .call(scene.zoomBehavior.transform, normalizedTransform);
}

function resolveSceneBounds(nodes) {
  const validNodes = (Array.isArray(nodes) ? nodes : []).filter((node) => (
    Number.isFinite(node?.x) && Number.isFinite(node?.y)
  ));

  if (!validNodes.length) {
    return null;
  }

  const bounds = validNodes.reduce((currentBounds, node) => {
    const halfLabelWidth = Math.max(NODE_RADIUS + 16, (Number(node?.labelWidth) || 0) / 2);
    const labelHeight = Number(node?.labelHeight) || 0;
    const top = node.y - (NODE_RADIUS + 20);
    const bottom = node.y + NODE_RADIUS + 16 + labelHeight;

    return {
      minX: Math.min(currentBounds.minX, node.x - halfLabelWidth),
      maxX: Math.max(currentBounds.maxX, node.x + halfLabelWidth),
      minY: Math.min(currentBounds.minY, top),
      maxY: Math.max(currentBounds.maxY, bottom),
    };
  }, {
    minX: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  });

  return {
    ...bounds,
    width: Math.max(1, bounds.maxX - bounds.minX),
    height: Math.max(1, bounds.maxY - bounds.minY),
    centerX: (bounds.minX + bounds.maxX) / 2,
    centerY: (bounds.minY + bounds.maxY) / 2,
  };
}

function resolveTooltipPosition(event, container) {
  if (!container) {
    return { x: 24, y: 24 };
  }

  const pointerEvent = event?.sourceEvent || event;
  const bounds = container.getBoundingClientRect();
  const clientX = Number(pointerEvent?.clientX);
  const clientY = Number(pointerEvent?.clientY);

  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) {
    return { x: 24, y: 24 };
  }

  return {
    x: clientX - bounds.left,
    y: clientY - bounds.top,
  };
}

function constrainSimulationNodes(nodes, dimensions) {
  (Array.isArray(nodes) ? nodes : []).forEach((node) => {
    node.x = clamp(node.x, node.labelWidth / 2, dimensions.width - (node.labelWidth / 2));
    node.y = clamp(node.y, NODE_RADIUS + 22, dimensions.height - node.labelHeight - NODE_RADIUS - 16);
  });
}

function syncStoredNodeLayout(layoutMap, nodes) {
  if (!(layoutMap instanceof Map)) {
    return;
  }

  const activeNodeIds = new Set();

  (Array.isArray(nodes) ? nodes : []).forEach((node) => {
    activeNodeIds.add(node.id);
    layoutMap.set(node.id, {
      x: node.x,
      y: node.y,
      fx: node.fx,
      fy: node.fy,
    });
  });

  Array.from(layoutMap.keys()).forEach((nodeId) => {
    if (!activeNodeIds.has(nodeId)) {
      layoutMap.delete(nodeId);
    }
  });
}

function resolveLegendItems(nodes) {
  const seen = new Set();

  return nodes
    .map((node) => String(node?.type || '').toLowerCase())
    .filter(Boolean)
    .filter((type) => {
      if (seen.has(type)) {
        return false;
      }

      seen.add(type);
      return true;
    })
    .slice(0, 6)
    .map((type) => ({
      type,
      label: formatTypeLabel(type),
      color: resolveNodeColor(type),
    }));
}

function resolveNodeColor(type) {
  const normalizedType = String(type || '').toLowerCase();
  return typePalette[normalizedType] || '#f5dfb8';
}

function resolveLinkDistance(weight) {
  return 205 - (clamp(weight, 0, 1) * 72);
}

function resolveChargeStrength(nodeCount) {
  if (nodeCount <= 10) {
    return -520;
  }

  if (nodeCount <= 35) {
    return -420;
  }

  return -320;
}

function resolveLinkPath(link) {
  const sourceX = Number(link?.source?.x);
  const sourceY = Number(link?.source?.y);
  const targetX = Number(link?.target?.x);
  const targetY = Number(link?.target?.y);

  if (![sourceX, sourceY, targetX, targetY].every(Number.isFinite)) {
    return '';
  }

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const distance = Math.sqrt((dx * dx) + (dy * dy)) || 1;
  const midpointX = (sourceX + targetX) / 2;
  const midpointY = (sourceY + targetY) / 2;
  const normalX = -dy / distance;
  const normalY = dx / distance;
  const direction = String(getLinkEndpointId(link?.source)) < String(getLinkEndpointId(link?.target)) ? 1 : -1;
  const curveAmount = Math.min(24, Math.max(8, distance * 0.08)) * (0.78 + (clamp(Number(link?.weight) || 0, 0, 1) * 0.32));
  const controlX = midpointX + (normalX * curveAmount * direction);
  const controlY = midpointY + (normalY * curveAmount * direction);

  return `M ${sourceX},${sourceY} Q ${controlX},${controlY} ${targetX},${targetY}`;
}

function resolveLinkColor(link, activeNodeId, highlightedNodeId) {
  const weight = clamp(Number(link?.weight) || 0.24, 0, 1);

  if (highlightedNodeId && isLinkConnectedToNode(link, highlightedNodeId)) {
    return `rgba(132, 216, 255, ${(0.5 + (weight * 0.28)).toFixed(3)})`;
  }

  if (isLinkConnectedToNode(link, activeNodeId)) {
    return `rgba(245, 190, 106, ${(0.34 + (weight * 0.26)).toFixed(3)})`;
  }

  return `rgba(132, 216, 255, ${(0.1 + (weight * 0.14)).toFixed(3)})`;
}

function resolveLinkOpacity(link, activeNodeId) {
  if (!activeNodeId) {
    return 1;
  }

  return isLinkConnectedToNode(link, activeNodeId) ? 1 : 0.52;
}

function resolveLinkWidth(link, activeNodeId, highlightedNodeId) {
  const weight = clamp(Number(link?.weight) || 0.22, 0, 1);

  if (highlightedNodeId && isLinkConnectedToNode(link, highlightedNodeId)) {
    return 2.2 + (weight * 2.4);
  }

  if (isLinkConnectedToNode(link, activeNodeId)) {
    return 1.7 + (weight * 1.8);
  }

  return 0.9 + (weight * 1.1);
}

function resolveNodeOpacity(nodeId, activeNodeId, connectedNodeIds) {
  if (!activeNodeId) {
    return 1;
  }

  if (nodeId === activeNodeId || connectedNodeIds.has(nodeId)) {
    return 1;
  }

  return 0.62;
}

function resolveNodeScale(nodeId, hoveredNodeId, selectedNodeId, highlightedNodeId, connectedNodeIds) {
  if (nodeId === highlightedNodeId) {
    return 1.16;
  }

  if (nodeId === selectedNodeId) {
    return 1.12;
  }

  if (nodeId === hoveredNodeId) {
    return 1.08;
  }

  if (connectedNodeIds.has(nodeId)) {
    return 1.03;
  }

  return 1;
}

function resolveLabelScale(nodeId, hoveredNodeId, selectedNodeId, highlightedNodeId) {
  if (nodeId === highlightedNodeId) {
    return 1.05;
  }

  if (nodeId === selectedNodeId) {
    return 1.03;
  }

  if (nodeId === hoveredNodeId) {
    return 1.02;
  }

  return 1;
}

function resolveNodeFilter(nodeId, hoveredNodeId, selectedNodeId, highlightedNodeId, connectedNodeIds) {
  if (nodeId === highlightedNodeId) {
    return 'drop-shadow(0 0 20px rgba(132,216,255,0.42)) drop-shadow(0 12px 28px rgba(0,0,0,0.28))';
  }

  if (nodeId === selectedNodeId) {
    return 'drop-shadow(0 0 16px rgba(245,190,106,0.34)) drop-shadow(0 10px 22px rgba(0,0,0,0.24))';
  }

  if (nodeId === hoveredNodeId) {
    return 'drop-shadow(0 0 12px rgba(255,255,255,0.18)) drop-shadow(0 10px 22px rgba(0,0,0,0.22))';
  }

  if (connectedNodeIds.has(nodeId)) {
    return 'drop-shadow(0 6px 18px rgba(0,0,0,0.18))';
  }

  return 'drop-shadow(0 6px 14px rgba(0,0,0,0.14))';
}

function resolveGlowOpacity(nodeId, hoveredNodeId, selectedNodeId, highlightedNodeId) {
  if (nodeId === highlightedNodeId) {
    return 0.26;
  }

  if (nodeId === selectedNodeId) {
    return 0.2;
  }

  if (nodeId === hoveredNodeId) {
    return 0.14;
  }

  return 0.06;
}

function resolveGlowRadius(nodeId, hoveredNodeId, selectedNodeId, highlightedNodeId) {
  if (nodeId === highlightedNodeId) {
    return 34;
  }

  if (nodeId === selectedNodeId) {
    return 31;
  }

  if (nodeId === hoveredNodeId) {
    return 28;
  }

  return 24;
}

function resolveHaloOpacity(nodeId, hoveredNodeId, selectedNodeId, highlightedNodeId) {
  if (nodeId === highlightedNodeId) {
    return 0.18;
  }

  if (nodeId === selectedNodeId) {
    return 0.14;
  }

  if (nodeId === hoveredNodeId) {
    return 0.1;
  }

  return 0.05;
}

function resolveRingStroke(nodeId, hoveredNodeId, selectedNodeId, highlightedNodeId) {
  if (nodeId === highlightedNodeId) {
    return 'rgba(213, 244, 255, 0.98)';
  }

  if (nodeId === selectedNodeId) {
    return 'rgba(255, 234, 196, 0.9)';
  }

  if (nodeId === hoveredNodeId) {
    return 'rgba(255, 255, 255, 0.6)';
  }

  return 'rgba(255, 255, 255, 0.18)';
}

function resolveRingWidth(nodeId, hoveredNodeId, selectedNodeId, highlightedNodeId) {
  if (nodeId === highlightedNodeId) {
    return 2.6;
  }

  if (nodeId === selectedNodeId) {
    return 2.2;
  }

  if (nodeId === hoveredNodeId) {
    return 1.8;
  }

  return 1.2;
}

function resolveShellStroke(nodeId, hoveredNodeId, selectedNodeId, highlightedNodeId) {
  if (nodeId === highlightedNodeId) {
    return 'rgba(213, 244, 255, 0.82)';
  }

  if (nodeId === selectedNodeId) {
    return 'rgba(255, 234, 196, 0.72)';
  }

  if (nodeId === hoveredNodeId) {
    return 'rgba(255, 255, 255, 0.3)';
  }

  return 'rgba(255,255,255,0.12)';
}

function resolveShellFill(nodeId, activeNodeId, connectedNodeIds) {
  if (nodeId === activeNodeId) {
    return 'rgba(20, 26, 34, 0.98)';
  }

  if (connectedNodeIds.has(nodeId)) {
    return 'rgba(18, 23, 30, 0.96)';
  }

  return 'rgba(17, 22, 28, 0.96)';
}

function resolveAvatarRingStroke(nodeId, hoveredNodeId, selectedNodeId, highlightedNodeId) {
  if (nodeId === highlightedNodeId) {
    return 'rgba(132, 216, 255, 0.8)';
  }

  if (nodeId === selectedNodeId) {
    return 'rgba(245, 190, 106, 0.6)';
  }

  if (nodeId === hoveredNodeId) {
    return 'rgba(255,255,255,0.4)';
  }

  return 'rgba(255,255,255,0.1)';
}

function resolveLabelFill(nodeId, activeNodeId, connectedNodeIds) {
  if (nodeId === activeNodeId) {
    return 'rgba(14, 11, 9, 0.92)';
  }

  if (connectedNodeIds.has(nodeId)) {
    return 'rgba(14, 11, 9, 0.82)';
  }

  return 'rgba(14, 11, 9, 0.72)';
}

function resolveLabelStroke(nodeId, hoveredNodeId, selectedNodeId, highlightedNodeId) {
  if (nodeId === highlightedNodeId) {
    return 'rgba(132, 216, 255, 0.34)';
  }

  if (nodeId === selectedNodeId) {
    return 'rgba(245, 190, 106, 0.26)';
  }

  if (nodeId === hoveredNodeId) {
    return 'rgba(255, 255, 255, 0.18)';
  }

  return 'rgba(255,255,255,0.08)';
}

function resolveTitleColor(nodeId, activeNodeId, connectedNodeIds) {
  if (nodeId === activeNodeId) {
    return '#fffaf0';
  }

  if (connectedNodeIds.has(nodeId)) {
    return '#f8ecd5';
  }

  return '#f4dfbd';
}

function buildConnectedNodeSet(links, nodeId) {
  const connectedNodes = new Set();

  if (!nodeId) {
    return connectedNodes;
  }

  (Array.isArray(links) ? links : []).forEach((link) => {
    const sourceId = getLinkEndpointId(link?.source);
    const targetId = getLinkEndpointId(link?.target);

    if (sourceId === nodeId && targetId) {
      connectedNodes.add(targetId);
    }

    if (targetId === nodeId && sourceId) {
      connectedNodes.add(sourceId);
    }
  });

  return connectedNodes;
}

function isLinkConnectedToNode(link, nodeId) {
  if (!nodeId) {
    return false;
  }

  const sourceId = getLinkEndpointId(link?.source);
  const targetId = getLinkEndpointId(link?.target);

  return sourceId === nodeId || targetId === nodeId;
}

function getLinkEndpointId(endpoint) {
  if (typeof endpoint === 'object' && endpoint !== null) {
    return String(endpoint.id || '').trim();
  }

  return String(endpoint || '').trim();
}

function splitTitleLines(title, maxCharactersPerLine = 16, maxLines = 2) {
  const words = String(title || '').split(/\s+/).filter(Boolean);

  if (!words.length) {
    return ['Untitled'];
  }

  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length <= maxCharactersPerLine || !currentLine) {
      currentLine = nextLine;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, maxLines).map((line, index, array) => {
    if (index === array.length - 1 && lines.length > maxLines) {
      return `${line.slice(0, Math.max(0, maxCharactersPerLine - 3)).trimEnd()}...`;
    }

    return line;
  });
}

function getNodeInitials(title) {
  const segments = String(title || '')
    .split(/\s+/)
    .filter(Boolean);

  if (!segments.length) {
    return 'SB';
  }

  return segments
    .slice(0, 2)
    .map((segment) => segment.charAt(0).toUpperCase())
    .join('');
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

function escapeNodeId(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '-');
}

function resolveZoomFilter(event) {
  if (event.type === 'dblclick') {
    return false;
  }

  if (event.type !== 'wheel' && Number(event.button) > 0) {
    return false;
  }

  return true;
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

export default GraphCanvas;
