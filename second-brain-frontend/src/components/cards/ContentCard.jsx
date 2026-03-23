import React from 'react';
import TagBadge from '../ui/TagBadge';
import { ExternalLink, Bookmark, Trash2 } from 'lucide-react';
import { useDeleteContent } from '../../hooks/useContent';

const ContentCard = ({ content }) => {
  const { _id, title, description, image, url, tags, type, siteName, createdAt } = content;
  const { deleteContent } = useDeleteContent();

  const handleDelete = async (e) => {
    e.preventDefault();
    if(window.confirm('Are you sure you want to delete this content?')) {
      await deleteContent(_id);
    }
  };

  return (
    <div className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:-translate-y-1">
      {/* Image section */}
      {image ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="aspect-video w-full overflow-hidden bg-slate-100 relative block">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </a>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" className="aspect-video w-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center block">
          <Bookmark className="w-12 h-12 text-indigo-200" />
        </a>
      )}

      {/* Content section */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex gap-2 flex-wrap mb-4">
          {type && <TagBadge label={type} />}
          {siteName && <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider my-auto">{siteName}</span>}
        </div>

        <a href={url} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-slate-800 leading-snug mb-2 line-clamp-2 hover:text-primary transition-colors" title={title}>
          {title}
        </a>
        
        {description && (
          <p className="text-sm text-slate-500 line-clamp-2 mb-4">
            {description}
          </p>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4 mt-auto">
            {tags.map((tag, idx) => (
              <span key={idx} className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">#{tag}</span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            {createdAt ? new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown Date'}
          </span>
          <div className="flex items-center gap-1">
            <button 
              onClick={handleDelete}
              className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
              title="Delete token"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-dark p-2 hover:bg-slate-50 rounded-full transition-colors"
              title="Open original"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;
