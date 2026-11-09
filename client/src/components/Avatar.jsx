import React, { useState } from 'react';

const sizeClasses = {
  xs: 'h-5 w-5 text-[8px]',
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
};

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ src, name = '', size = 'md', className = '' }) {
  const [imgError, setImgError] = useState(false);
  const showFallback = !src || imgError;

  return (
    <div
      className={`
        relative inline-flex items-center justify-center rounded-full overflow-hidden
        shrink-0 select-none
        hover:ring-2 hover:ring-ink/10 transition-all duration-150
        ${sizeClasses[size] || sizeClasses.md}
        ${showFallback ? 'bg-stone-200' : ''}
        ${className}
      `.trim()}
      title={name}
    >
      {showFallback ? (
        <span className="font-body font-medium text-secondary leading-none">
          {getInitials(name)}
        </span>
      ) : (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
}
