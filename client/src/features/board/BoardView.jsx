import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import useBoardStore from '../../stores/boardStore';
import useUiStore from '../../stores/uiStore';
import ListColumn from './ListColumn';
import CardItem from './CardItem';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import Input from '../../components/Input';
import toast from 'react-hot-toast';

export default function BoardView() {
  const { boardId } = useParams();
  const { lists, cards, isLoading, fetchBoardPayload, createList, moveCard, reorderList } = useBoardStore();
  const [activeCard, setActiveCard] = useState(null);
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    if (boardId) fetchBoardPayload(boardId);
  }, [boardId, fetchBoardPayload]);

  const handleDragStart = (event) => {
    const { active } = event;
    const allCards = Object.values(cards).flat();
    const card = allCards.find((c) => c.id === active.id);
    setActiveCard(card || null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveCard(null);
    if (!over || active.id === over.id) return;

    const allCards = Object.values(cards).flat();
    const draggedCard = allCards.find((c) => c.id === active.id);
    if (!draggedCard) return;

    const sourceListId = Object.keys(cards).find((lid) =>
      cards[lid].some((c) => c.id === active.id)
    );
    const destListId =
      Object.keys(cards).find((lid) => cards[lid].some((c) => c.id === over.id)) ||
      over.id;

    if (!sourceListId || !destListId) return;

    const destCards = cards[destListId] || [];
    const overIndex = destCards.findIndex((c) => c.id === over.id);
    const position = overIndex >= 0 ? overIndex : destCards.length;

    moveCard(draggedCard.id, sourceListId, destListId, position);
  };

  const handleAddList = async () => {
    if (!newListTitle.trim()) return;
    try {
      await createList(boardId, { title: newListTitle.trim() });
      setNewListTitle('');
      setAddingList(false);
    } catch {
      toast.error('Failed to create list');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto px-6 pb-6 h-[calc(100vh-64px)] hide-scrollbar">
        {lists.map((list) => (
          <ListColumn key={list.id} list={{ ...list, cards: cards[list.id] || [] }} />
        ))}

        {/* Add list */}
        <div className="flex-shrink-0 w-72">
          {addingList ? (
            <div className="bg-stone-50 rounded-xl p-3 space-y-2">
              <Input
                placeholder="List name"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddList();
                  if (e.key === 'Escape') setAddingList(false);
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={handleAddList}>Add list</Button>
                <Button size="sm" variant="ghost" onClick={() => setAddingList(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingList(true)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-body text-secondary rounded-xl hover:bg-stone-100 transition-colors border border-dashed border-border"
            >
              <Plus className="h-4 w-4" />
              Add list
            </button>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeCard ? <CardItem card={activeCard} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
