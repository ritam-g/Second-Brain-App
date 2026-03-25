import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCcw, SearchX, Sparkles } from 'lucide-react';
import { useSelector } from 'react-redux';
import MainLayout from '../../components/layout/MainLayout';
import SaveLinkPanel from '../../components/features/SaveLinkPanel';
import UploadPanel from '../../components/features/UploadPanel';
import MasonryGrid from '../../components/content/MasonryGrid';
import ContentCard from '../../components/content/ContentCard';
import TagChip from '../../components/content/TagChip';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import { useGetContent, useSaveContent, useFilteredContent, useUploadContent } from '../../hooks/useContent';
import { useLogout } from '../../hooks/useAuth';
import { notify } from '../../lib/toast';

const dashboardCategories = ['All', 'Links', 'Video', 'Social'];

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { items, loading, error } = useSelector((state) => state.content);
  const { getContent } = useGetContent();
  const { saveContent, loading: saveLoading } = useSaveContent();
  const { upload, loading: uploadLoading } = useUploadContent();
  const { performLogout, loading: logoutLoading } = useLogout();

  const [urlInput, setUrlInput] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const saveInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const { filteredContent: filteredItems } = useFilteredContent(items, {
    searchTerm: searchInput,
    selectedTag,
    selectedCategory,
  });

  const hasInitialLoadingState = loading && !items.length;

  return (
    <MainLayout
      user={user}
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      categories={dashboardCategories}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      onPrimaryAction={() => saveInputRef.current?.focus()}
      onLogout={performLogout}
      logoutLoading={logoutLoading}
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
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

      <section className="mt-10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.02)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-accent-soft">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Knowledge Canvas
            </div>

            <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-end md:gap-4">
              <h1 className="text-[2.1rem] font-extrabold leading-tight text-[#fff1d5] sm:text-[2.6rem]">
                Knowledge Canvas
              </h1>
              <p className="pb-1 text-sm text-obsidian-500">
                showing {filteredItems.length} of {items.length} entries
              </p>
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-obsidian-400">
              Save links, documents, and visual references into one curation surface. Search fast, filter by intent, and revisit the right artifact when context matters.
            </p>
          </div>

          <div className="obsidian-scroll flex gap-2 overflow-x-auto pb-1">
            {allTags.map((tag) => (
              <TagChip
                key={tag}
                label={tag}
                active={selectedTag === tag}
                onClick={() => setSelectedTag(tag)}
              />
            ))}
          </div>
        </div>

        {error && items.length > 0 ? (
          <GlassCard className="mt-6 flex flex-col gap-4 px-5 py-4 text-sm text-obsidian-400 sm:flex-row sm:items-center sm:justify-between">
            <p>{typeof error === 'string' ? error : 'Something went wrong while refreshing your archive.'}</p>
            <Button
              type="button"
              variant="surface"
              leadingIcon={<RefreshCcw className="h-4 w-4" />}
              onClick={getContent}
            >
              Retry
            </Button>
          </GlassCard>
        ) : null}

        <div className="mt-8">
          {error && !items.length ? (
            <DashboardErrorState onRetry={getContent} message={error} />
          ) : filteredItems.length > 0 || hasInitialLoadingState ? (
            <MasonryGrid
              items={filteredItems}
              loading={hasInitialLoadingState}
              renderItem={(item, index) => <ContentCard content={item} index={index} />}
            />
          ) : (
            <DashboardEmptyState searchActive={Boolean(searchInput.trim() || selectedTag !== 'All' || selectedCategory !== 'All')} />
          )}
        </div>
      </section>
    </MainLayout>
  );
};

function DashboardErrorState({ message, onRetry }) {
  return (
    <GlassCard className="mx-auto max-w-2xl px-6 py-10 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-300">Sync Error</p>
      <h2 className="mt-4 text-2xl font-bold text-[#fff1d5]">The archive could not be loaded.</h2>
      <p className="mt-3 text-sm leading-7 text-obsidian-400">
        {typeof message === 'string' ? message : 'A network error interrupted the dashboard refresh.'}
      </p>
      <Button
        type="button"
        variant="amber"
        className="mt-6 rounded-2xl px-5 py-3"
        leadingIcon={<RefreshCcw className="h-4 w-4" />}
        onClick={onRetry}
      >
        Retry
      </Button>
    </GlassCard>
  );
}

function DashboardEmptyState({ searchActive }) {
  return (
    <GlassCard className="mx-auto max-w-2xl px-6 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(248,174,29,0.12)] text-accent">
        <SearchX className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-2xl font-bold text-[#fff1d5]">
        {searchActive ? 'No content found' : 'Your archive is waiting for its first thought'}
      </h2>
      <p className="mt-3 text-sm leading-7 text-obsidian-400">
        {searchActive
          ? 'Try changing the search term, category, or tag filters to surface a different slice of your archive.'
          : 'Save a link or upload a document above to start building the knowledge canvas.'}
      </p>
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
