import React from 'react';

const variantClasses = {
  default: 'bg-stone-100 text-secondary',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
  info: 'bg-sky-50 text-sky-700',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
}) {
  return (
    <span
      className={`
        inline-flex items-center rounded-pill font-body font-medium leading-none
        ${variantClasses[variant] || variantClasses.default}
        ${sizeClasses[size] || sizeClasses.sm}
      `.trim()}
    >
      {children}
    </span>
  );
}
