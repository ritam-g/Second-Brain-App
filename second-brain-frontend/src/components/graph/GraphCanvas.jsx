import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

const typePalette = {
  article: '#F59E0B',     // amber
  youtube: '#EF4444',     // red
  video: '#22C55E',       // green
  pdf: '#06B6D4',         // cyan
  document: '#8B5CF6',    // violet
  image: '#EC4899',       // pink
  linkedin: '#3B82F6',    // blue
  instagram: '#F97316',   // orange
  tweet: '#6366F1',       // indigo
  x: '#14B8A6',           // teal
  github: '#A3A3A3',      // neutral gray (clean)
};

// Controlled D3 canvas for the knowledge graph route.
// Input: normalized nodes/edges plus explicit selection callback.
// Output: zoomable, draggable semantic graph with local hover tooltip state.
const GraphCanvas = ({
  nodes = [],
  edges = [],
  selectedNodeId = '',
  onNodeSelect,
}) => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const sceneRef = useRef(null);
  const onNodeSelectRef = useRef(onNodeSelect);
  const selectedNodeIdRef = useRef(selectedNodeId);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const graphData = useMemo(() => buildGraphData(nodes, edges), [nodes, edges]);

  onNodeSelectRef.current = onNodeSelect;
  selectedNodeIdRef.current = selectedNodeId;

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

    const simulationNodes = graphData.nodes.map((node) => ({ ...node }));
    const simulationLinks = graphData.links.map((link) => ({ ...link }));
    const root = svg.append('g');
    const linksLayer = root.append('g').attr('class', 'graph-links');
    const nodesLayer = root.append('g').attr('class', 'graph-nodes');

    const linkSelection = linksLayer
      .selectAll('line')
      .data(simulationLinks, (link) => link.id)
      .join('line')
      .attr('stroke-linecap', 'round');

    const nodeSelection = nodesLayer
      .selectAll('g')
      .data(simulationNodes, (node) => node.id)
      .join('g')
      .attr('class', 'graph-node')
      .style('cursor', 'pointer');

    nodeSelection.append('circle').attr('class', 'graph-node-halo');
    nodeSelection.append('circle').attr('class', 'graph-node-ring').attr('fill', 'transparent');
    nodeSelection.append('circle').attr('class', 'graph-node-core');

    const zoomBehavior = d3
      .zoom()
      .scaleExtent([0.5, 3.4])
      .on('zoom', (event) => {
        root.attr('transform', event.transform);
      });

    svg
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .attr('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`)
      .call(zoomBehavior)
      .on('dblclick.zoom', null)
      .on('click', () => {
        setHoveredNode(null);
      });

    const simulation = d3
      .forceSimulation(simulationNodes)
      .force(
        'link',
        d3
          .forceLink(simulationLinks)
          .id((node) => node.id)
          .distance((link) => resolveLinkDistance(link.weight))
          .strength(0.42),
      )
      .force('charge', d3.forceManyBody().strength(resolveChargeStrength(simulationNodes.length)))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide().radius(26))
      .alpha(0.9)
      .alphaDecay(0.055);

    const dragBehavior = d3
      .drag()
      .on('start', (event, node) => {
        if (!event.active) {
          simulation.alphaTarget(0.2).restart();
        }

        node.fx = node.x;
        node.fy = node.y;
      })
      .on('drag', (event, node) => {
        node.fx = event.x;
        node.fy = event.y;
        setTooltipPosition(resolveTooltipPosition(event, containerRef.current));
      })
      .on('end', (event, node) => {
        if (!event.active) {
          simulation.alphaTarget(0);
        }

        node.fx = null;
        node.fy = null;
      });

    nodeSelection
      .call(dragBehavior)
      .on('mouseenter', (event, node) => {
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
        focusNode({
          dimensions,
          node,
          svg,
          zoomBehavior,
        });
      });

    simulation.on('tick', () => {
      linkSelection
        .attr('x1', (link) => link.source.x)
        .attr('y1', (link) => link.source.y)
        .attr('x2', (link) => link.target.x)
        .attr('y2', (link) => link.target.y);

      nodeSelection.attr('transform', (node) => `translate(${node.x},${node.y})`);
    });

    sceneRef.current = {
      linkSelection,
      nodeSelection,
      simulation,
    };

    applySceneStyles(sceneRef.current, {
      hoveredNodeId: '',
      selectedNodeId: selectedNodeIdRef.current,
    });

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
    });
  }, [hoveredNode, selectedNodeId]);

  return (
    <div ref={containerRef} className="relative h-full min-h-[28rem] w-full overflow-hidden rounded-[28px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(103,232,249,0.09),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(248,174,29,0.08),_transparent_22%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle,rgba(103,232,249,0.22)_1px,transparent_1px)] [background-position:0_0] [background-size:2.6rem_2.6rem]" />

      <div className="absolute left-5 top-5 z-10 flex flex-wrap gap-2">
        {resolveLegendItems(graphData.nodes).map((item) => (
          <div
            key={item.type}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,204,102,0.08)] bg-[rgba(14,11,9,0.7)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-obsidian-400 backdrop-blur-xl"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </div>
        ))}
      </div>

      <svg ref={svgRef} className="relative z-[1] block h-full w-full" role="img" aria-label="Knowledge graph canvas" />

      {hoveredNode ? (
        <div
          className="pointer-events-none absolute z-20 max-w-[14rem] rounded-2xl border border-[rgba(255,191,64,0.18)] bg-[rgba(14,11,9,0.92)] px-4 py-3 shadow-[0_16px_35px_rgba(0,0,0,0.28)] backdrop-blur-xl"
          style={{
            left: `${clamp(tooltipPosition.x + 16, 16, Math.max(16, dimensions.width - 248))}px`,
            top: `${clamp(tooltipPosition.y + 16, 16, Math.max(16, dimensions.height - 108))}px`,
          }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">{formatTypeLabel(hoveredNode.type)}</p>
          <h4 className="mt-2 text-sm font-bold leading-6 text-[#fff2d7]">{hoveredNode.title}</h4>
        </div>
      ) : null}

      {!graphData.links.length && graphData.nodes.length ? (
        <div className="pointer-events-none absolute bottom-5 left-5 z-10 rounded-2xl border border-[rgba(255,204,102,0.08)] bg-[rgba(14,11,9,0.72)] px-4 py-3 text-xs leading-6 text-obsidian-400 backdrop-blur-xl">
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

  return {
    id,
    title: String(node?.title || 'Untitled Content').trim() || 'Untitled Content',
    image: String(node?.image || '').trim(),
    type: String(node?.type || 'document').trim() || 'document',
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

function applySceneStyles(scene, { hoveredNodeId, selectedNodeId }) {
  if (!scene?.nodeSelection || !scene?.linkSelection) {
    return;
  }

  const activeNodeId = hoveredNodeId || selectedNodeId;

  scene.linkSelection
    .attr('stroke', (link) => resolveLinkColor(link, activeNodeId))
    .attr('stroke-opacity', (link) => resolveLinkOpacity(link, activeNodeId))
    .attr('stroke-width', (link) => resolveLinkWidth(link, activeNodeId));

  scene.nodeSelection
    .select('.graph-node-halo')
    .attr('r', (node) => {
      if (node.id === selectedNodeId) {
        return 18;
      }

      if (node.id === hoveredNodeId) {
        return 14;
      }

      return 10;
    })
    .attr('fill', (node) => resolveNodeColor(node.type))
    .attr('fill-opacity', (node) => {
      if (node.id === selectedNodeId) {
        return 0.22;
      }

      if (node.id === hoveredNodeId) {
        return 0.14;
      }

      return 0.06;
    });

  scene.nodeSelection
    .select('.graph-node-ring')
    .attr('r', (node) => {
      if (node.id === selectedNodeId) {
        return 13;
      }

      if (node.id === hoveredNodeId) {
        return 11;
      }

      return 9;
    })
    .attr('stroke-width', (node) => (node.id === selectedNodeId ? 2 : 1.25))
    .attr('stroke', (node) => {
      if (node.id === selectedNodeId) {
        return 'rgba(255, 241, 213, 0.95)';
      }

      if (node.id === hoveredNodeId) {
        return 'rgba(255, 241, 213, 0.48)';
      }

      return 'rgba(255, 255, 255, 0.18)';
    });

  scene.nodeSelection
    .select('.graph-node-core')
    .attr('r', (node) => {
      if (node.id === selectedNodeId) {
        return 8;
      }

      if (node.id === hoveredNodeId) {
        return 7;
      }

      return 6;
    })
    .attr('fill', (node) => resolveNodeColor(node.type));
}

function focusNode({ dimensions, node, svg, zoomBehavior }) {
  if (!Number.isFinite(node?.x) || !Number.isFinite(node?.y)) {
    return;
  }

  const scale = 1.35;
  const translateX = (dimensions.width / 2) - (node.x * scale);
  const translateY = (dimensions.height / 2) - (node.y * scale);

  svg
    .transition()
    .duration(520)
    .call(
      zoomBehavior.transform,
      d3.zoomIdentity.translate(translateX, translateY).scale(scale),
    );
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
    .slice(0, 5)
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
  return 155 - (clamp(weight, 0, 1) * 62);
}

function resolveChargeStrength(nodeCount) {
  if (nodeCount <= 10) {
    return -240;
  }

  if (nodeCount <= 40) {
    return -170;
  }

  return -130;
}

function resolveLinkColor(link, activeNodeId) {
  const weight = clamp(Number(link?.weight) || 0.24, 0, 1);

  if (isLinkConnectedToNode(link, activeNodeId)) {
    return `rgba(103, 232, 249, ${(0.44 + (weight * 0.4)).toFixed(3)})`;
  }

  return `rgba(103, 232, 249, ${(0.08 + (weight * 0.16)).toFixed(3)})`;
}

function resolveLinkOpacity(link, activeNodeId) {
  if (!activeNodeId) {
    return 1;
  }

  return isLinkConnectedToNode(link, activeNodeId) ? 1 : 0.65;
}

function resolveLinkWidth(link, activeNodeId) {
  const weight = clamp(Number(link?.weight) || 0.2, 0, 1);

  if (isLinkConnectedToNode(link, activeNodeId)) {
    return 1.8 + (weight * 2.2);
  }

  return 0.8 + (weight * 1.3);
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default GraphCanvas;
