import React from 'react';

const paddingClasses = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({
  children,
  className = '',
  hover = false,
  onClick,
  padding = 'md',
}) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={`
        bg-surface rounded-xl shadow-card
        ${paddingClasses[padding] || paddingClasses.md}
        ${hover ? 'hover:shadow-elevated transition-shadow duration-200 cursor-pointer' : ''}
        ${onClick && !hover ? 'cursor-pointer' : ''}
        ${className}
      `.trim()}
      onClick={onClick}
    >
      {children}
    </Component>
  );
}
