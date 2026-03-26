import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { notify } from '../lib/toast';
import MainLayout from '../components/layout/MainLayout';
import ChatBox from '../components/ChatBox';
import { useLogout } from '../hooks/useAuth';
import { useSemanticSearch } from '../hooks/useSemanticSearch';

const initialAssistantMessage = {
  id: 'assistant-welcome',
  role: 'assistant',
  text: 'Ask me about anything inside your uploaded PDFs, OCR images, or saved content. I will answer using the most relevant chunks retrieved from your knowledge base.',
  sources: [],
  timestamp: formatTimestamp(new Date()),
};

// Deep Focus page for retrieval-grounded chat with the knowledge base.
// Input: user-authenticated page state and semantic search API results.
// Output: chat interface that uses real semantic retrieval for every answer.
const DeepFocus = () => {
  const { user } = useSelector((state) => state.auth);
  const { searchContent, loading } = useSemanticSearch();
  const { performLogout, loading: logoutLoading } = useLogout();
  const [questionDraft, setQuestionDraft] = useState('');
  const [messages, setMessages] = useState([initialAssistantMessage]);
  const composerRef = useRef(null);

  useEffect(() => {
    composerRef.current?.focus();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedQuestion = questionDraft.trim();

    if (!normalizedQuestion) {
      notify.info('Ask a question to start Deep Focus.', { toastId: 'deep-focus-empty-question' });
      return;
    }

    const timestamp = formatTimestamp(new Date());
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: normalizedQuestion,
      sources: [],
      timestamp,
    };

    setMessages((previousMessages) => [...previousMessages, userMessage]);
    setQuestionDraft('');

    const result = await searchContent(normalizedQuestion, { topK: 6 });

    if (!result.success) {
      setMessages((previousMessages) => [
        ...previousMessages,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          text: result.error || 'Deep Focus could not retrieve relevant knowledge right now.',
          sources: [],
          timestamp: formatTimestamp(new Date()),
        },
      ]);
      return;
    }

    const sources = Array.isArray(result.data) ? result.data.slice(0, 4) : [];
    const assistantMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      text: buildAssistantReply(normalizedQuestion, sources),
      sources,
      timestamp: formatTimestamp(new Date()),
    };

    setMessages((previousMessages) => [...previousMessages, assistantMessage]);
  };

  return (
    <MainLayout
      user={user}
      searchValue={questionDraft}
      onSearchChange={setQuestionDraft}
      categories={[]}
      selectedCategory=""
      onCategoryChange={() => {}}
      onPrimaryAction={() => composerRef.current?.focus()}
      onLogout={performLogout}
      logoutLoading={logoutLoading}
      searchPlaceholder="Ask your knowledge base..."
      rightMetaLabel="Grounded in your archive"
    >
      <ChatBox
        messages={messages}
        draft={questionDraft}
        onDraftChange={setQuestionDraft}
        onSubmit={handleSubmit}
        loading={loading}
        inputRef={composerRef}
      />
    </MainLayout>
  );
};

function buildAssistantReply(question, sources) {
  if (!sources.length) {
    return `I could not find a grounded answer for "${question}" in your current knowledge base. Try broader wording, or upload the relevant document first.`;
  }

  const highlights = sources
    .slice(0, 3)
    .map((source, index) => `${index + 1}. ${source.title}: ${source.matchedChunkText || source.description || 'Relevant context found.'}`)
    .join('\n\n');

  return [
    `I found ${sources.length} relevant knowledge chunk${sources.length === 1 ? '' : 's'} for "${question}".`,
    'Here is the strongest grounded context I retrieved:',
    highlights,
    'Open the cited sources below to inspect the original document or content directly.',
  ].join('\n\n');
}

function formatTimestamp(date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default DeepFocus;
