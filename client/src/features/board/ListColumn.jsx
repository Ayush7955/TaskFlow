import { useState } from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Plus, X, Check } from 'lucide-react';
import useBoardStore from '../../stores/boardStore';
import CardItem from './CardItem';
import DropdownMenu from '../../components/DropdownMenu';
import toast from 'react-hot-toast';

function DroppableArea({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 overflow-y-auto space-y-2 hide-scrollbar min-h-[2px] rounded-lg transition-colors ${isOver ? 'bg-stone-100/60' : ''}`}
    >
      {children}
    </div>
  );
}

export default function ListColumn({ list }) {
  const { createCard, updateList, deleteList } = useBoardStore();
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(list.title);

  const cardIds = (list.cards || []).map((c) => c.id);

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) return;
    try {
      await createCard(list.id, { title: newCardTitle.trim() });
      setNewCardTitle('');
      setAddingCard(false);
    } catch {
      toast.error('Failed to create card');
    }
  };

  const handleRenameList = async () => {
    if (!title.trim() || title === list.title) {
      setEditingTitle(false);
      return;
    }
    try {
      await updateList(list.id, { title: title.trim() });
    } catch {
      toast.error('Failed to rename list');
      setTitle(list.title);
    }
    setEditingTitle(false);
  };

  const handleDeleteList = async () => {
    try {
      await deleteList(list.id);
    } catch {
      toast.error('Failed to delete list');
    }
  };

  const menuItems = [
    { label: 'Rename', onClick: () => setEditingTitle(true) },
    { label: 'Delete list', onClick: handleDeleteList, danger: true },
  ];

  return (
    <div className="flex-shrink-0 w-72 flex flex-col bg-stone-50 rounded-xl p-3 max-h-full border border-border/50">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        {editingTitle ? (
          <input
            className="flex-1 text-sm font-medium text-ink bg-white rounded-lg px-2 py-1 border border-border outline-none focus:ring-2 focus:ring-ink"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleRenameList}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRenameList(); if (e.key === 'Escape') setEditingTitle(false); }}
            autoFocus
          />
        ) : (
          <h3
            className="flex-1 text-sm font-medium text-ink cursor-default truncate"
            onDoubleClick={() => setEditingTitle(true)}
          >
            {list.title}
          </h3>
        )}
        <span className="text-xs text-muted bg-stone-200 rounded-pill px-2 py-0.5">
          {list.cards?.length || 0}
        </span>
        <DropdownMenu
          trigger={<button className="p-1 rounded-md hover:bg-stone-200 text-muted hover:text-ink transition-colors"><MoreHorizontal className="h-4 w-4" /></button>}
          items={menuItems}
          align="right"
        />
      </div>

      {/* Cards */}
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <DroppableArea id={list.id}>
          {(list.cards || []).map((card) => (
            <SortableCardItem key={card.id} card={card} listId={list.id} />
          ))}
        </DroppableArea>
      </SortableContext>

      {/* Add card */}
      <div className="mt-2">
        {addingCard ? (
          <div className="space-y-2">
            <textarea
              className="w-full text-sm font-body text-ink bg-white rounded-xl border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-ink resize-none"
              placeholder="Card title..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard(); } if (e.key === 'Escape') setAddingCard(false); }}
              rows={2}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddCard}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-ink text-canvas rounded-pill hover:bg-ink-800"
              >
                <Check className="h-3 w-3" /> Add
              </button>
              <button
                onClick={() => setAddingCard(false)}
                className="p-1.5 text-muted hover:text-ink rounded-lg hover:bg-stone-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingCard(true)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-muted hover:text-ink hover:bg-stone-100 rounded-lg transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add a card
          </button>
        )}
      </div>
    </div>
  );
}

function SortableCardItem({ card, listId }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={isDragging ? 'opacity-40' : ''}>
      <CardItem card={card} listId={listId} />
    </div>
  );
}
