import React from 'react';

const baseInputClasses =
  'w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-ink font-body text-sm focus:ring-2 focus:ring-ink focus:border-transparent outline-none transition-colors duration-150';

const errorInputClasses =
  'w-full rounded-xl border border-red-400 bg-surface px-4 py-2.5 text-ink font-body text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none transition-colors duration-150';

export default function Input({ label, error, id, className = '', ...rest }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="block font-body text-sm text-secondary mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={error ? errorInputClasses : baseInputClasses}
        {...rest}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-600 font-body">{error}</p>
      )}
    </div>
  );
}

export function Textarea({ label, error, id, className = '', ...rest }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="block font-body text-sm text-secondary mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`${error ? errorInputClasses : baseInputClasses} resize-y min-h-[80px]`}
        {...rest}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-600 font-body">{error}</p>
      )}
    </div>
  );
}
