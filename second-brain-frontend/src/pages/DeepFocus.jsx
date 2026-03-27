import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { notify } from '../utils/toast';
import MainLayout from '../components/layout/MainLayout';
import ChatContainer from '../components/chat/ChatContainer';
import { useLogout } from '../hooks/useAuth';
import { useChat } from '../features/chat/hooks/useChat';

// Deep Focus is the dedicated RAG chat surface for asking grounded questions against the user's archive.
// Input: authenticated user session plus backend RAG responses.
// Output: premium chat interface that renders answers and cited source chunks.
const DeepFocus = () => {
  const { user } = useSelector((state) => state.auth);
  const { messages, draft, setDraft, loading, sendMessage } = useChat();
  const { performLogout, loading: logoutLoading } = useLogout();
  const composerRef = useRef(null);

  useEffect(() => {
    composerRef.current?.focus();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedQuestion = draft.trim();

    if (!normalizedQuestion) {
      notify.info('Ask a question to start Deep Focus.', { toastId: 'deep-focus-empty-question' });
      return;
    }

    const result = await sendMessage(normalizedQuestion, { topK: 6 });

    if (!result.success) {
      notify.error(result.error || 'Deep Focus could not answer that question right now.', {
        toastId: 'deep-focus-query-error',
      });
    }
  };

  return (
    <MainLayout
      user={user}
      searchValue={draft}
      onSearchChange={setDraft}
      categories={[]}
      selectedCategory=""
      onCategoryChange={() => {}}
      onPrimaryAction={() => composerRef.current?.focus()}
      onLogout={performLogout}
      logoutLoading={logoutLoading}
      searchPlaceholder="Ask anything about your knowledge..."
      rightMetaLabel="Pinecone retrieval + Mistral answer"
    >
      <ChatContainer
        messages={messages}
        draft={draft}
        onDraftChange={setDraft}
        onSubmit={handleSubmit}
        loading={loading}
        inputRef={composerRef}
      />
    </MainLayout>
  );
};

export default DeepFocus;
