import React from 'react';

const variantClasses = {
  mint: 'bg-orb-mint',
  peach: 'bg-orb-peach',
  lavender: 'bg-orb-lavender',
  sky: 'bg-orb-sky',
  rose: 'bg-orb-rose',
};

const sizeClasses = {
  sm: 'w-32 h-32',
  md: 'w-64 h-64',
  lg: 'w-96 h-96',
};

export default function OrbDecoration({
  variant = 'mint',
  size = 'md',
  className = '',
  style,
}) {
  return (
    <div
      className={`
        absolute pointer-events-none rounded-full opacity-40 blur-3xl
        ${variantClasses[variant] || variantClasses.mint}
        ${sizeClasses[size] || sizeClasses.md}
        ${className}
      `.trim()}
      style={style}
      aria-hidden="true"
    />
  );
}
