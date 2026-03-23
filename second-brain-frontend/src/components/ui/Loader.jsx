import React from 'react';

const Loader = ({ className = '' }) => {
  return (
    <div className={`flex justify-center items-center p-8 ${className}`}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
    </div>
  );
};

export default Loader;
