import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCcw, SearchX, Sparkles } from 'lucide-react';
import { useSelector } from 'react-redux';
import MainLayout from '../../components/layout/MainLayout';
import SaveLinkPanel from '../../features/content-ingest/components/SaveLinkPanel';
import UploadPanel from '../../features/content-ingest/components/UploadPanel';
import MasonryGrid from '../../components/content/MasonryGrid';
import ContentCard from '../../components/content/ContentCard';
import ContentViewer from '../../components/content/ContentViewer';
import TagChip from '../../components/content/TagChip';
import { normalizeContentCollection } from '../../components/content/utils';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import ResurfacingSection from '../../features/resurfacing/components/ResurfacingSection';
import { useGetContent, useSaveContent, useFilteredContent, useUploadContent } from '../../hooks/useContent';
import { useContentViewer } from '../../hooks/useContentViewer';
import { useLogout } from '../../hooks/useAuth';
import { useSemanticSearch } from '../../features/search/hooks/useSemanticSearch';
import { notify } from '../../utils/toast';

const dashboardCategories = ['All', 'Links', 'Documents', 'Images', 'Video', 'Social'];

/**
 * Dashboard Component
 * Responsibility: orchestrates archive actions and keeps feed/search rendering on one shared card system.
 * Handles: content loading, cross-source normalization, and dashboard state fallbacks.
 */
const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { items, loading, error } = useSelector((state) => state.content);
  const { getContent } = useGetContent();
  const { saveContent, loading: saveLoading } = useSaveContent();
  const { upload, loading: uploadLoading } = useUploadContent();
  const { performLogout, loading: logoutLoading } = useLogout();
  const { selectedContent, isViewerOpen, closeViewer } = useContentViewer();
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: semanticResults,
    loading: semanticLoading,
    error: semanticError,
    runSearch,
    clearSearch,
    isSearchActive,
  } = useSemanticSearch({
    autoSearch: true,
    debounceMs: 350,
    topK: 12,
  });

  const [urlInput, setUrlInput] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedTag, setSelectedTag] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isResultsHighlighted, setIsResultsHighlighted] = useState(false);
  const [pendingCanvasFocusToken, setPendingCanvasFocusToken] = useState(0);

  const saveInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const resultsSectionRef = useRef(null);
  const pendingResultsFocusRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const highlightTimeoutRef = useRef(null);
  const canvasFocusFrameRef = useRef(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    getContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => {
    window.clearTimeout(scrollTimeoutRef.current);
    window.clearTimeout(highlightTimeoutRef.current);
    window.cancelAnimationFrame(canvasFocusFrameRef.current);
  }, []);

  useEffect(() => () => {
    closeViewer();
  }, [closeViewer]);

  const handleSave = async (event) => {
    event.preventDefault();
    const normalizedUrl = urlInput.trim();

    if (!normalizedUrl) {
      notify.info('Paste a URL to archive it.', { toastId: 'save-url-empty' });
      return;
    }

    if (!isValidHttpUrl(normalizedUrl)) {
      notify.warning('Enter a valid URL starting with http:// or https://.', { toastId: 'save-url-invalid' });
      return;
    }

    const result = await saveContent({ url: normalizedUrl });

    if (result.success) {
      setUrlInput('');
      setPendingCanvasFocusToken(Date.now());
    }
  };

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;

    if (!nextFile) {
      setSelectedFile(null);
      return;
    }

    if (!isSupportedUploadFile(nextFile)) {
      notify.warning('Choose a PDF or image file to upload.', { toastId: 'upload-file-invalid' });
      event.target.value = '';
      setSelectedFile(null);
      return;
    }

    setSelectedFile(nextFile);
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      notify.info('Select a PDF or image before uploading.', { toastId: 'upload-file-empty' });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    const normalizedTitle = uploadTitle.trim();
    if (normalizedTitle) {
      formData.append('title', normalizedTitle);
    }

    const result = await upload(formData);

    if (result.success) {
      setSelectedFile(null);
      setUploadTitle('');
      setPendingCanvasFocusToken(Date.now());

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const allTags = useMemo(() => {
    const tags = new Set(['All']);

    items.forEach((item) => {
      (item.tags || []).forEach((tag) => {
        const normalizedTag = String(tag || '').toLowerCase().trim();

        if (normalizedTag && normalizedTag !== 'upload') {
          tags.add(normalizedTag);
        }
      });
    });

    return Array.from(tags).slice(0, 12);
  }, [items]);

  const flashResultsSection = useCallback(() => {
    window.clearTimeout(highlightTimeoutRef.current);
    setIsResultsHighlighted(true);

    highlightTimeoutRef.current = window.setTimeout(() => {
      setIsResultsHighlighted(false);
    }, 700);
  }, []);

  const scrollToResults = useCallback(() => {
    const resultsElement = resultsSectionRef.current;

    if (!resultsElement) {
      return;
    }

    const prefersReducedMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const topOffset = resultsElement.getBoundingClientRect().top;
    const isOutsideFocusZone = topOffset < 96 || topOffset > window.innerHeight * 0.35;

    if (isOutsideFocusZone) {
      resultsElement.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }

    flashResultsSection();
  }, [flashResultsSection]);

  const queueResultsFocus = useCallback((type) => {
    pendingResultsFocusRef.current = type === 'search'
      ? { type: 'search', phase: 'awaiting-search-start' }
      : { type: 'filter', phase: 'ready' };
  }, []);

  const handleSearchChange = useCallback((nextQuery) => {
    const normalizedQuery = String(nextQuery || '');

    if (normalizedQuery.trim()) {
      queueResultsFocus('search');
    } else {
      pendingResultsFocusRef.current = null;
      setIsResultsHighlighted(false);
    }

    setSearchQuery(normalizedQuery);
  }, [queueResultsFocus, setSearchQuery]);

  const handleCategoryChange = useCallback((nextCategory) => {
    if (nextCategory === selectedCategory) {
      return;
    }

    if (!isSearchActive) {
      queueResultsFocus('filter');
    }

    setSelectedCategory(nextCategory);
  }, [isSearchActive, queueResultsFocus, selectedCategory]);

  const handleTagChange = useCallback((nextTag) => {
    if (nextTag === selectedTag) {
      return;
    }

    queueResultsFocus('filter');
    setSelectedTag(nextTag);
  }, [queueResultsFocus, selectedTag]);

  const handleClearSearch = useCallback(() => {
    pendingResultsFocusRef.current = null;
    setIsResultsHighlighted(false);
    clearSearch();
  }, [clearSearch]);

  const { filteredContent: filteredItems } = useFilteredContent(items, {
    selectedTag,
    selectedCategory,
  });
  const hasInitialLoadingState = loading && !items.length;
  // Keep a fast lookup so normalized search/resurfacing items can still point back to real saved content.
  const availableContentIds = useMemo(
    () => new Set(
      items
        .map((item) => String(item?._id || item?.id || '').trim())
        .filter(Boolean),
    ),
    [items],
  );
  const normalizedFeedItems = useMemo(
    () => normalizeContentCollection(filteredItems, { context: 'feed' }),
    [filteredItems],
  );
  // Normalize semantic results into the same shape the default dashboard cards already expect.
  const normalizedSearchItems = useMemo(
    () => normalizeContentCollection(semanticResults, { context: 'search' }).filter((item) => {
      if (!item?.deleteId || !availableContentIds.size) {
        return true;
      }

      return availableContentIds.has(String(item.deleteId).trim());
    }),
    [availableContentIds, semanticResults],
  );
  // Switch datasets based on search state, while keeping the UI renderer constant.
  const dataToRender = isSearchActive ? normalizedSearchItems : normalizedFeedItems;
  const isGridLoading = isSearchActive ? semanticLoading : hasInitialLoadingState;

  const activeError = isSearchActive ? semanticError : error;
  const resultCount = dataToRender.length;
  const totalCount = isSearchActive ? normalizedSearchItems.length : items.length;

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const pendingFocus = pendingResultsFocusRef.current;

    if (!pendingFocus) {
      return;
    }

    // Wait for debounced semantic search to enter and exit loading so scroll lands on the final results state.
    if (pendingFocus.type === 'search') {
      if (pendingFocus.phase === 'awaiting-search-start') {
        if (!semanticLoading) {
          return;
        }

        pendingResultsFocusRef.current = { type: 'search', phase: 'awaiting-search-complete' };
        return;
      }

      if (semanticLoading) {
        return;
      }
    }

    if (pendingFocus.type === 'filter' && hasInitialLoadingState) {
      return;
    }

    window.clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = window.setTimeout(() => {
      scrollToResults();
      pendingResultsFocusRef.current = null;
    }, 80);

    return () => {
      window.clearTimeout(scrollTimeoutRef.current);
    };
  }, [
    activeError,
    dataToRender.length,
    hasInitialLoadingState,
    scrollToResults,
    searchQuery,
    selectedCategory,
    selectedTag,
    semanticLoading,
  ]);

  useEffect(() => {
    if (!pendingCanvasFocusToken) {
      return;
    }

    // Run after the save/upload render commit so the canvas section is ready in the DOM.
    window.cancelAnimationFrame(canvasFocusFrameRef.current);
    canvasFocusFrameRef.current = window.requestAnimationFrame(() => {
      scrollToResults();
      setPendingCanvasFocusToken(0);
    });

    return () => {
      window.cancelAnimationFrame(canvasFocusFrameRef.current);
    };
  }, [pendingCanvasFocusToken, scrollToResults]);

  return (
    <MainLayout
      user={user}
      searchValue={searchQuery}
      onSearchChange={handleSearchChange}
      categories={dashboardCategories}
      selectedCategory={selectedCategory}
      onCategoryChange={handleCategoryChange}
      onPrimaryAction={() => saveInputRef.current?.focus()}
      onLogout={performLogout}
      logoutLoading={logoutLoading}
      searchPlaceholder="Search by title, tags, or semantic meaning..."
    >
      <div
        className="dashboard-page debug-dashboard-page"
        data-debug="dashboard-page"
        data-view={isSearchActive ? 'search' : 'feed'}
        data-category={selectedCategory}
        data-tag={selectedTag}
      >
        <section
          className="dashboard-actions debug-dashboard-actions grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]"
          data-debug="dashboard-actions"
        >
          <SaveLinkPanel
            value={urlInput}
            onChange={setUrlInput}
            onSubmit={handleSave}
            loading={saveLoading}
            inputRef={saveInputRef}
          />
          <UploadPanel
            selectedFile={selectedFile}
            title={uploadTitle}
            onTitleChange={setUploadTitle}
            onFileChange={handleFileChange}
            onSubmit={handleUpload}
            loading={uploadLoading}
            fileInputRef={fileInputRef}
          />
        </section>

        {!isSearchActive ? <ResurfacingSection /> : null}

        <section
          className="dashboard-feed debug-dashboard-feed mt-10"
          data-debug="dashboard-feed"
          data-mode={isSearchActive ? 'search' : 'browse'}
        >
          <div
            className="dashboard-header debug-dashboard-header flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between"
            data-debug="dashboard-header"
          >
            <div className="dashboard-heading debug-dashboard-heading" data-debug="dashboard-heading">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.02)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-accent-soft">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Knowledge Canvas
              </div>

              <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-end md:gap-4">
                <h1 className="dashboard-title debug-dashboard-title text-[2.1rem] font-extrabold leading-tight text-[#fff1d5] sm:text-[2.6rem]">
                  {isSearchActive ? 'Semantic Search' : 'Knowledge Canvas'}
                </h1>
                <p className="dashboard-count debug-dashboard-count pb-1 text-sm text-obsidian-500">
                  showing {resultCount} of {totalCount} {isSearchActive ? 'saved content matches' : 'content'}
                </p>
              </div>

              <p className="dashboard-description debug-dashboard-description mt-3 max-w-2xl text-sm leading-7 text-obsidian-400">
                {isSearchActive
                  ? 'Results below are grounded in retrieved Pinecone matches from your PDFs, images, and saved content.'
                  : 'Save links, documents, and visual references into one curation surface. Search fast, filter by intent, and revisit the right artifact when context matters.'}
              </p>
            </div>

            {isSearchActive ? (
              <Button
                type="button"
                variant="surface"
                className="dashboard-clear-search debug-dashboard-clear-search rounded-2xl px-5 py-3"
                data-debug="dashboard-clear-search"
                onClick={handleClearSearch}
              >
                Clear Search
              </Button>
            ) : (
              <div
                className="dashboard-tags debug-dashboard-tags obsidian-scroll flex gap-2 overflow-x-auto pb-1"
                data-debug="dashboard-tags"
              >
                {allTags.map((tag) => (
                  <TagChip
                    key={tag}
                    label={tag}
                    active={selectedTag === tag}
                    onClick={() => handleTagChange(tag)}
                  />
                ))}
              </div>
            )}
          </div>

          {!isSearchActive && activeError && items.length > 0 ? (
            <GlassCard
              className="dashboard-inline-error debug-dashboard-inline-error mt-6 flex flex-col gap-4 px-5 py-4 text-sm text-obsidian-400 sm:flex-row sm:items-center sm:justify-between"
              data-debug="dashboard-inline-error"
            >
              <p>{typeof activeError === 'string' ? activeError : 'Something went wrong while refreshing your archive.'}</p>
              <Button
                type="button"
                variant="surface"
                leadingIcon={<RefreshCcw className="h-4 w-4" />}
                data-debug="dashboard-inline-error-retry"
                onClick={getContent}
              >
                Retry
              </Button>
            </GlassCard>
          ) : null}

          <div
            ref={resultsSectionRef}
            className={`dashboard-results debug-dashboard-results mt-8 scroll-mt-40 rounded-[32px] transition-[background-color,box-shadow,transform] duration-500 ${
              isResultsHighlighted
                ? 'bg-[rgba(248,174,29,0.03)] shadow-[0_0_0_1px_rgba(248,174,29,0.08),0_0_32px_rgba(248,174,29,0.12)]'
                : ''
            }`}
            data-debug="dashboard-results"
            data-highlighted={isResultsHighlighted ? 'true' : 'false'}
            data-state={activeError && !dataToRender.length && !isGridLoading ? 'error' : dataToRender.length > 0 || isGridLoading ? 'results' : 'empty'}
          >
            {activeError && !dataToRender.length && !isGridLoading ? (
              <DashboardErrorState
                onRetry={isSearchActive ? () => runSearch(searchQuery) : getContent}
                message={activeError}
                eyebrow={isSearchActive ? 'Semantic Search Error' : 'Sync Error'}
                title={isSearchActive ? 'The knowledge query could not be completed.' : 'The archive could not be loaded.'}
                actionLabel={isSearchActive ? 'Retry Search' : 'Retry'}
              />
            ) : dataToRender.length > 0 || isGridLoading ? (
              // Masonry layout keeps mixed-height cards visually stable across all dashboard states.
              <MasonryGrid
                items={dataToRender}
                loading={isGridLoading}
                renderItem={(item, index) => <ContentCard content={item} index={index} />}
              />
            ) : (
              <DashboardEmptyState
                mode={isSearchActive ? 'search' : selectedTag !== 'All' || selectedCategory !== 'All' ? 'filter' : 'default'}
              />
            )}
          </div>
        </section>
      </div>

      <ContentViewer
        content={selectedContent}
        isOpen={isViewerOpen}
        onClose={closeViewer}
      />
    </MainLayout>
  );
};

/**
 * DashboardErrorState Component
 * Responsibility: surfaces recoverable dashboard failures without changing the surrounding layout.
 */
function DashboardErrorState({
  message,
  onRetry,
  eyebrow = 'Sync Error',
  title = 'The archive could not be loaded.',
  actionLabel = 'Retry',
}) {
  return (
    <GlassCard
      className="dashboard-error-state debug-dashboard-error mx-auto max-w-2xl px-6 py-10 text-center"
      data-debug="dashboard-error-state"
    >
      <p className="dashboard-error-eyebrow debug-dashboard-error-eyebrow text-[11px] font-bold uppercase tracking-[0.2em] text-red-300">{eyebrow}</p>
      <h2 className="dashboard-error-title debug-dashboard-error-title mt-4 text-2xl font-bold text-[#fff1d5]">{title}</h2>
      <p className="dashboard-error-message debug-dashboard-error-message mt-3 text-sm leading-7 text-obsidian-400">
        {typeof message === 'string' ? message : 'A network error interrupted the dashboard refresh.'}
      </p>
      <Button
        type="button"
        variant="amber"
        className="dashboard-error-retry debug-dashboard-error-retry mt-6 rounded-2xl px-5 py-3"
        leadingIcon={<RefreshCcw className="h-4 w-4" />}
        data-debug="dashboard-error-retry"
        onClick={onRetry}
      >
        {actionLabel}
      </Button>
    </GlassCard>
  );
}

/**
 * DashboardEmptyState Component
 * Responsibility: explains why no cards are currently visible for the active dashboard mode.
 */
function DashboardEmptyState({ mode = 'default' }) {
  const title = mode === 'search'
    ? 'No semantic matches found'
    : mode === 'filter'
      ? 'No content found'
      : 'Your archive is waiting for its first thought';
  const description = mode === 'search'
    ? 'Try broadening the question or asking with different wording to surface a different slice of your archive.'
    : mode === 'filter'
      ? 'Try changing the tag or category filters to surface a different slice of your archive.'
      : 'Save a link or upload a document above to start building the knowledge canvas.';

  return (
    <GlassCard
      className="dashboard-empty-state debug-dashboard-empty mx-auto max-w-2xl px-6 py-12 text-center"
      data-debug="dashboard-empty-state"
      data-mode={mode}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(248,174,29,0.12)] text-accent">
        <SearchX className="h-6 w-6" />
      </div>
      <h2 className="dashboard-empty-title debug-dashboard-empty-title mt-5 text-2xl font-bold text-[#fff1d5]">{title}</h2>
      <p className="dashboard-empty-description debug-dashboard-empty-description mt-3 text-sm leading-7 text-obsidian-400">{description}</p>
    </GlassCard>
  );
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isSupportedUploadFile(file) {
  if (!file) {
    return false;
  }

  const normalizedType = String(file.type || '').toLowerCase();
  const normalizedName = String(file.name || '').toLowerCase();

  return normalizedType === 'application/pdf'
    || normalizedType.startsWith('image/')
    || /\.(pdf|png|jpe?g|webp|gif|bmp|svg)$/i.test(normalizedName);
}

export default Dashboard;
