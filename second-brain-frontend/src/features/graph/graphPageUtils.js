export const graphCategories = ['All', 'Links', 'Documents', 'Images', 'Video', 'Social'];

export function normalizeGraphPayload({ nodes, edges }) {
  const nodesById = new Map();

  (Array.isArray(nodes) ? nodes : []).forEach((node) => {
    const normalizedNode = normalizeGraphNode(node);

    if (!normalizedNode || nodesById.has(normalizedNode.id)) {
      return;
    }

    nodesById.set(normalizedNode.id, normalizedNode);
  });

  const edgesById = new Map();

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
    const edgeId = `${firstId}::${secondId}`;
    const weight = Math.max(0, Math.min(1, Number(edge?.weight) || 0));
    const existingEdge = edgesById.get(edgeId);

    if (!existingEdge || weight > existingEdge.weight) {
      edgesById.set(edgeId, {
        id: edgeId,
        source: sourceId,
        target: targetId,
        weight,
      });
    }
  });

  return {
    nodes: Array.from(nodesById.values()),
    edges: Array.from(edgesById.values()),
  };
}

export function normalizeGraphNode(node) {
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

export function enrichGraphNode(node, content) {
  if (!node) {
    return null;
  }

  return {
    ...node,
    title: String(content?.title || node.title || 'Untitled Content').trim() || 'Untitled Content',
    image: String(content?.image || node.image || '').trim(),
    type: String(content?.type || node.type || 'document').trim() || 'document',
  };
}

export function resolveGraphCategory(node) {
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

export function resolvePreferredNodeId(nodes, edges) {
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
  let preferredScore = preferredNode ? scores.get(preferredNode.id) || 0 : -1;

  nodes.forEach((node) => {
    const nextScore = scores.get(node.id) || 0;

    if (nextScore > preferredScore) {
      preferredNode = node;
      preferredScore = nextScore;
    }
  });

  return String(preferredNode?.id || '');
}

export function resolveRelatedNodes({ selectedNode, nodes, edges }) {
  if (!selectedNode) {
    return [];
  }

  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const relationships = [];

  edges.forEach((edge) => {
    const sourceId = getLinkEndpointId(edge?.source);
    const targetId = getLinkEndpointId(edge?.target);
    const weight = Number(edge?.weight) || 0;

    if (sourceId !== selectedNode.id && targetId !== selectedNode.id) {
      return;
    }

    const relatedId = sourceId === selectedNode.id ? targetId : sourceId;
    const relatedNode = nodesById.get(relatedId);

    if (!relatedNode) {
      return;
    }

    relationships.push({
      id: relatedNode.id,
      title: relatedNode.title,
      type: relatedNode.type,
      weight,
      weightLabel: `${Math.round(Math.max(0, Math.min(1, weight)) * 100)}%`,
    });
  });

  return relationships.sort((a, b) => b.weight - a.weight);
}

export function getLinkEndpointId(endpoint) {
  if (typeof endpoint === 'object' && endpoint !== null) {
    return String(endpoint.id || '').trim();
  }

  return String(endpoint || '').trim();
}

export function normalizeSearchQuery(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

export function buildGraphRouteSearch({ category, nodeId, searchQuery }) {
  const nextSearchParams = new URLSearchParams();
  const normalizedCategory = graphCategories.includes(String(category || '').trim())
    ? String(category || '').trim()
    : 'All';
  const normalizedNodeId = String(nodeId || '').trim();
  const normalizedSearch = String(searchQuery || '').trim();

  if (normalizedCategory !== 'All') {
    nextSearchParams.set('category', normalizedCategory);
  }

  if (normalizedNodeId) {
    nextSearchParams.set('node', normalizedNodeId);
  }

  if (normalizedSearch) {
    nextSearchParams.set('q', normalizedSearch);
  }

  return nextSearchParams;
}
