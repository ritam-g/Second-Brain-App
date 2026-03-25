import React, { useEffect, useMemo, useState } from 'react';
import { Search, Link as LinkIcon } from 'lucide-react';
import { useSelector } from 'react-redux';
import ContentCard from '../../components/cards/ContentCard';
import Navbar from '../../components/layout/Navbar';
import EmptyState from '../../components/ui/EmptyState';
import Loader from '../../components/ui/Loader';
import Button from '../../components/ui/Button';
import { useGetContent, useSaveContent, useFilteredContent } from '../../hooks/useContent';
import { notify } from '../../lib/toast';

const Dashboard = () => {
  const { items, loading, error } = useSelector((state) => state.content);
  const { getContent } = useGetContent();
  const { saveContent, loading: saveLoading } = useSaveContent();

  const [urlInput, setUrlInput] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

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
              Save articles, papers, and ideas to your permanent archive in one click.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSave}
          className="max-w-3xl mx-auto mb-16 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2 focus-within:ring-4 focus-within:ring-primary/20 focus-within:border-primary transition-all"
        >
          <div className="pl-4 text-slate-400">
            <LinkIcon className="w-5 h-5" />
          </div>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste any URL to save..."
            className="flex-1 bg-transparent px-2 py-3 outline-none text-slate-700 font-medium"
            required
          />
          <Button
            type="submit"
            loading={saveLoading}
            disabled={loading && items.length === 0}
            className="px-6 rounded-xl"
          >
            Save
          </Button>
        </form>

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
              description={searchInput ? 'Try adjusting your search query.' : 'Paste a link above to start collecting your digital assets.'}
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

export default Dashboard;
