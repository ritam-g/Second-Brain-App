import React from 'react';

const TagBadge = ({ label }) => {
  return (
    <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
      {label}
    </span>
  );
};

export default TagBadge;
