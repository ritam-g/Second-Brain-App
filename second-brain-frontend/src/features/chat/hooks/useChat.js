import { useCallback, useState } from 'react';
import { askAI } from '../../../api/rag.api';
import { getApiErrorMessage } from '../../../utils/api-error';

const defaultWelcomeMessages = [
  {
    id: 'assistant-welcome',
    role: 'assistant',
    text: 'Ask anything about your saved PDFs, OCR captures, links, or research. I will retrieve the most relevant context from your archive and answer from that grounded evidence.',
    sources: [],
    timestamp: formatTimestamp(new Date()),
  },
];

// Manages Deep Focus chat state, calls the backend RAG API, and appends grounded assistant replies.
// Input: optional initial messages for bootstrapping the conversation.
// Output: chat messages, draft state, loading state, and an imperative sendMessage action.
export const useChat = ({ initialMessages = defaultWelcomeMessages } = {}) => {
  const [messages, setMessages] = useState(() => cloneMessages(initialMessages));
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendMessage = useCallback(async (question, options = {}) => {
    const normalizedQuestion = String(question || '').trim();

    if (!normalizedQuestion) {
      return {
        success: false,
        error: 'Ask a question to start Deep Focus.',
      };
    }

    const userMessage = buildMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      text: normalizedQuestion,
      sources: [],
    });

    setMessages((previousMessages) => [...previousMessages, userMessage]);
    setLoading(true);
    setError('');
    setDraft('');

    try {
      const response = await askAI({
        query: normalizedQuestion,
        topK: options.topK,
      });
      const payload = normalizeRagPayload(response);
      const assistantMessage = buildMessage({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: payload.answer,
        sources: payload.sources,
      });

      setMessages((previousMessages) => [...previousMessages, assistantMessage]);

      return {
        success: true,
        data: payload,
      };
    } catch (chatError) {
      const message = getApiErrorMessage(chatError, 'Deep Focus could not answer that question right now.');

      setError(message);
      setMessages((previousMessages) => [
        ...previousMessages,
        buildMessage({
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          text: message,
          sources: [],
        }),
      ]);

      return {
        success: false,
        error: message,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearConversation = useCallback(() => {
    setMessages(cloneMessages(initialMessages));
    setDraft('');
    setError('');
    setLoading(false);
  }, [initialMessages]);

  return {
    messages,
    draft,
    setDraft,
    loading,
    error,
    sendMessage,
    clearConversation,
  };
};

function normalizeRagPayload(response) {
  const payload = response?.data && typeof response.data === 'object'
    ? response.data
    : response;
  const answer = String(payload?.answer || '').trim() || 'I found related context, but I could not generate a grounded answer.';
  const sources = Array.isArray(payload?.sources)
    ? payload.sources.map((source, index) => normalizeSource(source, index)).filter(Boolean)
    : [];

  return {
    answer,
    sources,
  };
}

function normalizeSource(source, index) {
  if (!source || typeof source !== 'object') {
    return null;
  }

  const contentId = String(source.contentId || source.metadata?.contentId || '').trim();
  const title = String(source.title || source.metadata?.title || 'Untitled Content').trim();
  const type = String(source.type || source.metadata?.type || 'article').trim().toLowerCase() || 'article';
  const image = String(source.image || source.metadata?.image || '').trim();
  const url = String(source.url || source.metadata?.url || '').trim();
  const createdAt = String(source.createdAt || source.metadata?.createdAt || '').trim();
  const matchedChunkText = String(
    source.text
    || source.matchedChunkText
    || source.metadata?.text
    || '',
  )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 320);
  const description = String(
    source.description
    || source.summary
    || source.metadata?.description
    || source.metadata?.summary
    || matchedChunkText,
  )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);
  const numericScore = Number(source.score);

  return {
    id: String(source.id || `${contentId || 'rag-source'}-${index}`),
    contentId,
    title,
    type,
    image,
    url,
    createdAt,
    description,
    matchedChunkText,
    text: matchedChunkText,
    score: Number.isFinite(numericScore) ? numericScore : null,
  };
}

function buildMessage({ id, role, text, sources }) {
  return {
    id,
    role,
    text,
    sources,
    timestamp: formatTimestamp(new Date()),
  };
}

function formatTimestamp(date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function cloneMessages(messages) {
  return Array.isArray(messages)
    ? messages.map((message) => ({ ...message, sources: Array.isArray(message.sources) ? [...message.sources] : [] }))
    : [];
}

export default useChat;
