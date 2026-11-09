import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {Icon && (
        <div className="flex items-center justify-center bg-stone-100 rounded-full p-4">
          <Icon size={24} className="text-muted" />
        </div>
      )}

      {title && (
        <h3 className="font-display font-light text-xl text-ink mt-4">
          {title}
        </h3>
      )}

      {description && (
        <p className="text-muted text-sm mt-2 max-w-sm text-center font-body">
          {description}
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
