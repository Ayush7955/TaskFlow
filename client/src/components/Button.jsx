import React from 'react';
import Spinner from './Spinner';

const variantClasses = {
  primary:
    'bg-ink text-canvas rounded-pill hover:bg-ink-800 active:bg-ink-700 disabled:opacity-50',
  ghost:
    'bg-transparent border border-stone-300 text-ink rounded-pill hover:bg-stone-100',
  danger:
    'bg-transparent border border-red-300 text-red-700 rounded-pill hover:bg-red-50',
  link: 'bg-transparent text-ink underline-offset-4 hover:underline p-0',
};

const sizeClasses = {
  sm: 'px-4 py-1.5 text-sm',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled = false,
  loading = false,
  ...rest
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-body font-medium
        transition-colors duration-150
        ${variantClasses[variant] || variantClasses.primary}
        ${variant !== 'link' ? sizeClasses[size] || sizeClasses.md : ''}
        ${isDisabled ? 'pointer-events-none opacity-50' : ''}
        ${className}
      `.trim()}
      disabled={isDisabled}
      {...rest}
    >
      {loading && <Spinner size="sm" className="shrink-0" />}
      {children}
    </button>
  );
}
