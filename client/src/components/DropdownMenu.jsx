import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function DropdownMenu({
  trigger,
  items = [],
  align = 'right',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, close]);

  const handleItemClick = (item) => {
    item.onClick?.();
    close();
  };

  return (
    <div className="relative inline-block">
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={() => setIsOpen((prev) => !prev)}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {/* Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className={`
            absolute z-40 mt-1 min-w-[180px]
            bg-surface rounded-xl shadow-elevated border border-border p-1
            ${align === 'right' ? 'right-0' : 'left-0'}
          `.trim()}
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => handleItemClick(item)}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body
                  transition-colors duration-100
                  ${
                    item.danger
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-ink hover:bg-stone-50'
                  }
                `.trim()}
              >
                {Icon && <Icon size={16} className="shrink-0" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
