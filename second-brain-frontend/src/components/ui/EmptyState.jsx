import React from 'react';
import { ArchiveX } from 'lucide-react';

const EmptyState = ({ title = "No items found", description = "Try saving some new content or modifying your filters." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
      <div className="bg-slate-200/50 p-4 rounded-full mb-4">
        <ArchiveX className="w-10 h-10 text-slate-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm">{description}</p>
    </div>
  );
};

export default EmptyState;
