import React, { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const typePalette = {
  article: '#f8ae1d',
  youtube: '#7dd3fc',
  video: '#7dd3fc',
  pdf: '#67e8f9',
  document: '#67e8f9',
  image: '#fda4af',
  linkedin: '#93c5fd',
  instagram: '#fb7185',
  tweet: '#a5b4fc',
  x: '#a5b4fc',
  github: '#86efac',
};

// Interactive force-directed graph canvas for semantic content relationships.
// Input: normalized node/edge lists plus selection handlers.
// Output: responsive graph surface with drag, zoom, hover labels, and click selection.
const GraphView = ({
  nodes = [],
  edges = [],
  selectedNodeId = '',
  onNodeSelect,
}) => {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const didZoomToFitRef = useRef(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState('');
  const graphData = useMemo(() => ({
    nodes: nodes.map((node) => ({ ...node })),
    links: edges.map((edge) => ({ ...edge })),
  }), [edges, nodes]);

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
    didZoomToFitRef.current = false;
  }, [graphData]);

  return (
    <div ref={containerRef} className="relative h-full min-h-[28rem] w-full overflow-hidden rounded-[28px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(103,232,249,0.09),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(248,174,29,0.08),_transparent_22%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle,rgba(103,232,249,0.22)_1px,transparent_1px)] [background-position:0_0] [background-size:2.6rem_2.6rem]" />

      <div className="absolute left-5 top-5 z-10 flex flex-wrap gap-2">
        {resolveLegendItems(nodes).map((item) => (
          <div
            key={item.type}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,204,102,0.08)] bg-[rgba(14,11,9,0.7)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-obsidian-400 backdrop-blur-xl"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </div>
        ))}
      </div>

      {dimensions.width > 0 && dimensions.height > 0 ? (
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"
          nodeRelSize={6}
          minZoom={0.35}
          maxZoom={8}
          cooldownTicks={110}
          d3AlphaDecay={0.045}
          d3VelocityDecay={0.24}
          nodeLabel={(node) => buildNodeTooltip(node)}
          linkWidth={(link) => Math.max(1, (Number(link?.weight) || 0.35) * 3)}
          linkColor={(link) => resolveLinkColor(link, selectedNodeId)}
          linkDirectionalParticles={(link) => isLinkConnectedToNode(link, selectedNodeId) ? 2 : 0}
          linkDirectionalParticleWidth={(link) => isLinkConnectedToNode(link, selectedNodeId) ? Math.max(1.4, (Number(link?.weight) || 0.35) * 2.2) : 0}
          linkDirectionalParticleColor={() => 'rgba(255, 241, 213, 0.82)'}
          onNodeHover={(node) => {
            setHoveredNodeId(String(node?.id || ''));
          }}
          onNodeClick={(node) => {
            onNodeSelect?.(node);

            if (graphRef.current && Number.isFinite(node?.x) && Number.isFinite(node?.y)) {
              graphRef.current.centerAt(node.x, node.y, 650);
              graphRef.current.zoom(2.15, 700);
            }
          }}
          onEngineStop={() => {
            if (!didZoomToFitRef.current && graphRef.current && graphData.nodes.length) {
              didZoomToFitRef.current = true;
              graphRef.current.zoomToFit(500, 110);
            }
          }}
          nodeCanvasObject={(node, context, globalScale) => {
            drawGraphNode({
              node,
              context,
              globalScale,
              isSelected: String(node?.id || '') === selectedNodeId,
              isHovered: String(node?.id || '') === hoveredNodeId,
            });
          }}
          nodePointerAreaPaint={(node, color, context) => {
            context.fillStyle = color;
            context.beginPath();
            context.arc(node.x, node.y, 12, 0, 2 * Math.PI, false);
            context.fill();
          }}
        />
      ) : null}

      {!edges.length && nodes.length ? (
        <div className="pointer-events-none absolute bottom-5 left-5 z-10 rounded-2xl border border-[rgba(255,204,102,0.08)] bg-[rgba(14,11,9,0.72)] px-4 py-3 text-xs leading-6 text-obsidian-400 backdrop-blur-xl">
          Semantic links will appear here once your saved content has stronger cross-document similarity.
        </div>
      ) : null}
    </div>
  );
};

function drawGraphNode({ node, context, globalScale, isSelected, isHovered }) {
  const accentColor = resolveNodeColor(node?.type);
  const radius = isSelected ? 7.4 : isHovered ? 6.1 : 5.1;
  const ringRadius = radius + (isSelected ? 4.6 : 2.6);

  context.save();
  context.beginPath();
  context.fillStyle = accentColor;
  context.shadowColor = accentColor;
  context.shadowBlur = isSelected ? 22 : 12;
  context.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
  context.fill();

  context.beginPath();
  context.lineWidth = isSelected ? 1.9 : 1.15;
  context.strokeStyle = isSelected ? 'rgba(255, 241, 213, 0.92)' : 'rgba(255, 255, 255, 0.28)';
  context.arc(node.x, node.y, ringRadius, 0, 2 * Math.PI, false);
  context.stroke();

  if (isSelected || isHovered) {
    const label = truncateLabel(node?.title || 'Untitled Content', 28);
    const fontSize = 12 / globalScale;
    const paddingX = 8 / globalScale;
    const paddingY = 5 / globalScale;
    const offsetX = 14 / globalScale;
    const offsetY = 18 / globalScale;

    context.font = `700 ${fontSize}px Manrope, sans-serif`;
    const textWidth = context.measureText(label).width;
    const boxWidth = textWidth + (paddingX * 2);
    const boxHeight = fontSize + (paddingY * 2);
    const boxX = node.x + offsetX;
    const boxY = node.y + offsetY;

    context.shadowBlur = 0;
    context.beginPath();
    drawRoundedRect(context, boxX, boxY, boxWidth, boxHeight, 7 / globalScale);
    context.fillStyle = 'rgba(14, 11, 9, 0.88)';
    context.fill();
    context.strokeStyle = 'rgba(255, 191, 64, 0.22)';
    context.lineWidth = 1 / globalScale;
    context.stroke();

    context.fillStyle = '#fff2d7';
    context.textBaseline = 'middle';
    context.fillText(label, boxX + paddingX, boxY + (boxHeight / 2));
  }

  context.restore();
}

function drawRoundedRect(context, x, y, width, height, radius) {
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
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

function buildNodeTooltip(node) {
  const title = truncateLabel(node?.title || 'Untitled Content', 42);
  const type = formatTypeLabel(node?.type);

  return `
    <div style="border:1px solid rgba(255,191,64,0.18);border-radius:16px;background:rgba(14,11,9,0.92);padding:10px 12px;color:#fff2d7;backdrop-filter:blur(16px);font-family:Manrope,sans-serif;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:rgba(248,174,29,0.92);">${type}</div>
      <div style="margin-top:6px;font-size:13px;font-weight:700;line-height:1.45;">${escapeHtml(title)}</div>
    </div>
  `;
}

function resolveNodeColor(type) {
  const normalizedType = String(type || '').toLowerCase();
  return typePalette[normalizedType] || '#f5dfb8';
}

function resolveLinkColor(link, selectedNodeId) {
  const weight = Number(link?.weight) || 0.35;
  const alpha = isLinkConnectedToNode(link, selectedNodeId)
    ? Math.min(0.82, 0.28 + weight * 0.55)
    : Math.min(0.34, 0.08 + weight * 0.22);

  return `rgba(103, 232, 249, ${alpha.toFixed(3)})`;
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
    return String(endpoint.id || '');
  }

  return String(endpoint || '');
}

function truncateLabel(value, maxLength) {
  const normalizedValue = String(value || '').replace(/\s+/g, ' ').trim();

  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
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

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export default GraphView;
