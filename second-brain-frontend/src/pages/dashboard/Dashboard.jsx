import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileImage, FileText, Link as LinkIcon, Search, UploadCloud } from 'lucide-react';
import { useSelector } from 'react-redux';
import ContentCard from '../../components/cards/ContentCard';
import Navbar from '../../components/layout/Navbar';
import EmptyState from '../../components/ui/EmptyState';
import Loader from '../../components/ui/Loader';
import Button from '../../components/ui/Button';
import { useGetContent, useSaveContent, useFilteredContent, useUploadContent } from '../../hooks/useContent';
import { notify } from '../../lib/toast';

const Dashboard = () => {
  const { items, loading, error } = useSelector((state) => state.content);
  const { getContent } = useGetContent();
  const { saveContent, loading: saveLoading } = useSaveContent();
  const { upload, loading: uploadLoading } = useUploadContent();

  const [urlInput, setUrlInput] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const fileInputRef = useRef(null);

  useEffect(() => {
    getContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const normalizedUrl = urlInput.trim();

    if (!normalizedUrl) {
      notify.info('Paste a URL to save it to your library.', { toastId: 'save-url-empty' });
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

  const handleFileChange = (e) => {
    const nextFile = e.target.files?.[0] || null;

    if (!nextFile) {
      setSelectedFile(null);
      return;
    }

    if (!isSupportedUploadFile(nextFile)) {
      notify.warning('Choose a PDF or image file to upload.', { toastId: 'upload-file-invalid' });
      e.target.value = '';
      setSelectedFile(null);
      return;
    }

    setSelectedFile(nextFile);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      notify.info('Select a PDF or image before uploading.', { toastId: 'upload-file-empty' });
      return;
    }

    if (!isSupportedUploadFile(selectedFile)) {
      notify.warning('Only PDF and image files are supported.', { toastId: 'upload-file-unsupported' });
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
      if (item.type) {
        tags.add(item.type);
      }

      if (item.tags) {
        item.tags.forEach((tag) => tags.add(tag));
      }
    });

    return Array.from(tags);
  }, [items]);

  const { filteredContent: filteredItems } = useFilteredContent(items, searchInput, selectedTag);

  return (
    <div className="min-h-screen bg-slate-50 pt-16 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 md:px-12">
        <div className="text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-4 tracking-tight">
              Capture your inspiration.
            </h1>
            <p className="text-lg text-slate-500">
              Save links, PDFs, images, and ideas to your permanent archive in one place.
            </p>
          </div>
        </div>

        <div className="grid gap-6 mb-16 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
          <form
            onSubmit={handleSave}
            className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                <LinkIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-800">Save from a link</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Paste an article, tweet, or resource URL and keep it searchable inside your dashboard.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste any URL to save..."
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15"
                required
              />
              <Button
                type="submit"
                loading={saveLoading}
                disabled={loading && items.length === 0}
                className="rounded-2xl px-6 py-3 md:self-stretch"
              >
                Save Link
              </Button>
            </div>
          </form>

          <form
            onSubmit={handleUpload}
            className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-800">Upload PDF or image</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add screenshots, scans, PDFs, and notes. The backend will process and tag them automatically.
                </p>
              </div>
            </div>

            <label
              htmlFor="content-upload"
              className="mt-6 flex cursor-pointer flex-col gap-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 transition-colors hover:border-primary hover:bg-primary/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm">
                  {selectedFile && isPdfFile(selectedFile) ? (
                    <FileText className="h-5 w-5" />
                  ) : (
                    <FileImage className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-700">
                    {selectedFile ? selectedFile.name : 'Choose a file to upload'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {selectedFile
                      ? `${isPdfFile(selectedFile) ? 'PDF document' : 'Image file'} | ${formatFileSize(selectedFile.size)}`
                      : 'Supports PDF, PNG, JPG, WEBP, GIF, and other image formats.'}
                  </p>
                </div>
              </div>

              <div className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                Browse files
              </div>
            </label>

            <input
              id="content-upload"
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              onChange={handleFileChange}
              className="sr-only"
            />

            <input
              type="text"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="Enter title (optional)"
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15"
              maxLength={120}
            />

            <Button
              type="submit"
              loading={uploadLoading}
              disabled={!selectedFile || (loading && items.length === 0)}
              className="mt-4 w-full rounded-2xl py-3"
            >
              Upload File
            </Button>
          </form>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${selectedTag === tag ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {error && !items.length && (
          <div className="text-red-500 bg-red-50 p-4 rounded-xl text-center font-medium my-4 border border-red-100">
            {typeof error === 'string' ? error : 'Something went wrong.'}
          </div>
        )}

        {loading && !items.length ? (
          <div className="flex justify-center items-center py-20">
            <Loader />
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <ContentCard key={item._id} content={item} />
            ))}
          </div>
        ) : (
          <div className="pt-8">
            <EmptyState
              title={searchInput ? 'No results found' : 'Your brain is empty'}
              description={searchInput ? 'Try adjusting your search query.' : 'Save a link or upload a file above to start collecting your digital assets.'}
            />
          </div>
        )}
      </main>
    </div>
  );
};

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

function isPdfFile(file) {
  const normalizedType = String(file?.type || '').toLowerCase();
  const normalizedName = String(file?.name || '').toLowerCase();

  return normalizedType === 'application/pdf' || normalizedName.endsWith('.pdf');
}

function formatFileSize(size) {
  if (!Number.isFinite(size) || size <= 0) {
    return 'Unknown size';
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default Dashboard;
