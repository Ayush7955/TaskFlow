import { create } from 'zustand';
import api from '../utils/api';

const useBoardStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────
  boards: [],
  currentBoard: null,
  lists: [],
  cards: {}, // keyed by listId → array of cards
  labels: [],
  members: [],
  isLoading: false,

  // ── Board Actions ──────────────────────────────────────

  /**
   * Fetch all boards for a workspace.
   */
  fetchBoards: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/workspaces/${workspaceId}/boards`);
      const raw = data.data || data;
      const boards = Array.isArray(raw) ? raw : (raw.boards || []);
      set({ boards });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Fetch full board payload (board + lists + cards + labels + members).
   */
  fetchBoardPayload: async (boardId) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/boards/${boardId}`);
      const payload = data.data || data;
      get().setBoardPayload(payload);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Parse a board payload into individual state slices.
   */
  setBoardPayload: (payload) => {
    const board = payload.board || payload;
    const lists = payload.lists || [];
    const labels = payload.labels || [];
    const members = payload.members || board.members || [];

    // Group cards by listId (checking nested list.cards first)
    const cardsByList = {};
    lists.forEach((list) => {
      const lid = list.id ?? list.public_id;
      cardsByList[lid] = Array.isArray(list.cards) ? [...list.cards] : [];
    });

    // Also include top-level payload.cards if present
    const extraCards = payload.cards || [];
    extraCards.forEach((card) => {
      const listId = card.list_id ?? card.listId ?? card.list;
      if (!cardsByList[listId]) cardsByList[listId] = [];
      const cardKey = card.public_id || card.id;
      if (!cardsByList[listId].some((c) => (c.public_id || c.id) === cardKey)) {
        cardsByList[listId].push(card);
      }
    });

    // Sort cards by position within each list
    Object.keys(cardsByList).forEach((listId) => {
      cardsByList[listId].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    });

    // Sort lists by position
    const sortedLists = [...lists].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    set({
      currentBoard: board,
      lists: sortedLists,
      cards: cardsByList,
      labels,
      members,
    });
  },

  // ── List Actions ───────────────────────────────────────

  /**
   * Create a new list on a board.
   */
  createList: async (boardId, listData) => {
    const { data } = await api.post(`/boards/${boardId}/lists`, listData);
    const newList = data.data || data;

    set((state) => ({
      lists: [...state.lists, newList],
      cards: { ...state.cards, [newList._id || newList.id]: [] },
    }));

    return newList;
  },

  /**
   * Update a list's properties (e.g. title).
   */
  updateList: async (listId, listData) => {
    const { data } = await api.patch(`/lists/${listId}`, listData);
    const updated = data.data || data;

    set((state) => ({
      lists: state.lists.map((l) =>
        (l._id || l.id) === listId ? { ...l, ...updated } : l
      ),
    }));

    return updated;
  },

  /**
   * Delete a list.
   */
  deleteList: async (listId) => {
    await api.delete(`/lists/${listId}`);

    set((state) => {
      const newCards = { ...state.cards };
      delete newCards[listId];

      return {
        lists: state.lists.filter((l) => (l._id || l.id) !== listId),
        cards: newCards,
      };
    });
  },

  /**
   * Reorder lists via drag-and-drop. Optimistic update.
   */
  reorderList: (activeId, overId) => {
    set((state) => {
      const oldIndex = state.lists.findIndex(
        (l) => (l._id || l.id) === activeId
      );
      const newIndex = state.lists.findIndex(
        (l) => (l._id || l.id) === overId
      );

      if (oldIndex === -1 || newIndex === -1) return state;

      const updated = [...state.lists];
      const [moved] = updated.splice(oldIndex, 1);
      updated.splice(newIndex, 0, moved);

      // Update position values
      const withPositions = updated.map((list, idx) => ({
        ...list,
        position: idx,
      }));

      return { lists: withPositions };
    });

    // Persist to server
    const { lists, currentBoard } = get();
    const boardId = currentBoard?._id || currentBoard?.id;
    if (boardId) {
      const order = lists.map((l) => l._id || l.id);
      api.patch(`/boards/${boardId}/lists/reorder`, { order }).catch((err) => {
        console.error('Failed to persist list reorder:', err);
      });
    }
  },

  // ── Card Actions ───────────────────────────────────────

  /**
   * Create a new card in a list.
   */
  createCard: async (listId, cardData) => {
    const { data } = await api.post(`/lists/${listId}/cards`, cardData);
    const newCard = data.data || data;

    set((state) => ({
      cards: {
        ...state.cards,
        [listId]: [...(state.cards[listId] || []), newCard],
      },
    }));

    return newCard;
  },

  /**
   * Update a card's properties.
   */
  updateCard: async (cardId, cardData) => {
    const { data } = await api.patch(`/cards/${cardId}`, cardData);
    const updated = data.data || data;

    set((state) => {
      const newCards = { ...state.cards };

      // Find and update in the correct list
      for (const listId of Object.keys(newCards)) {
        const idx = newCards[listId].findIndex(
          (c) => (c._id || c.id) === cardId
        );
        if (idx !== -1) {
          newCards[listId] = [...newCards[listId]];
          newCards[listId][idx] = { ...newCards[listId][idx], ...updated };
          break;
        }
      }

      return { cards: newCards };
    });

    return updated;
  },

  /**
   * Move a card between lists with optimistic update.
   */
  moveCard: async (cardId, fromListId, toListId, position) => {
    // Optimistic update
    set((state) => {
      const newCards = { ...state.cards };
      const fromList = [...(newCards[fromListId] || [])];
      const toList =
        fromListId === toListId ? fromList : [...(newCards[toListId] || [])];

      const cardIndex = fromList.findIndex(
        (c) => (c._id || c.id) === cardId
      );
      if (cardIndex === -1) return state;

      const [card] = fromList.splice(cardIndex, 1);
      const movedCard = {
        ...card,
        listId: toListId,
        list: toListId,
        position,
      };

      if (fromListId === toListId) {
        fromList.splice(position, 0, movedCard);
        newCards[fromListId] = fromList;
      } else {
        toList.splice(position, 0, movedCard);
        newCards[fromListId] = fromList;
        newCards[toListId] = toList;
      }

      return { cards: newCards };
    });

    // Persist
    try {
      await api.patch(`/cards/${cardId}/move`, {
        listId: toListId,
        position,
      });
    } catch (err) {
      console.error('Failed to persist card move:', err);
      // Re-fetch to restore correct state
      const { currentBoard } = get();
      if (currentBoard) {
        get().fetchBoardPayload(currentBoard._id || currentBoard.id);
      }
    }
  },

  /**
   * Delete a card from a list.
   */
  deleteCard: async (listId, cardId) => {
    await api.delete(`/cards/${cardId}`);

    set((state) => ({
      cards: {
        ...state.cards,
        [listId]: (state.cards[listId] || []).filter(
          (c) => (c._id || c.id) !== cardId
        ),
      },
    }));
  },

  // ── Label Helpers ──────────────────────────────────────

  /**
   * Add a label to the board's label list.
   */
  addLabel: (label) => {
    set((state) => ({
      labels: [...state.labels, label],
    }));
  },

  /**
   * Remove a label from the board's label list.
   */
  removeLabel: (labelId) => {
    set((state) => ({
      labels: state.labels.filter((l) => (l._id || l.id) !== labelId),
    }));
  },

  // ── Cleanup ────────────────────────────────────────────

  /**
   * Reset board-specific state when navigating away.
   */
  clearBoard: () => {
    set({
      currentBoard: null,
      lists: [],
      cards: {},
      labels: [],
      members: [],
    });
  },
}));

export default useBoardStore;
