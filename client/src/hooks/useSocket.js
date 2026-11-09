import { useEffect, useState, useCallback } from 'react';
import { socket } from '../utils/socket';
import useAuthStore from '../stores/authStore';
import useBoardStore from '../stores/boardStore';

/**
 * Manages socket.io real-time connectivity for a board.
 *
 * Joins the board room on mount, registers listeners for all
 * board / list / card events, and cleans everything up on unmount
 * or when `boardId` changes.
 *
 * @param {string} boardId — The board to join
 * @returns {{ onlineMembers: Array, isConnected: boolean }}
 */
export default function useSocket(boardId) {
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // ── Board-store actions used by socket handlers ──────────
  const setBoardPayload = useBoardStore((s) => s.setBoardPayload);

  // ── Stable handler factories ─────────────────────────────
  const handleCardCreated = useCallback(
    (data) => {
      const card = data.card || data;
      const listId = card.listId || card.list;
      useBoardStore.setState((state) => ({
        cards: {
          ...state.cards,
          [listId]: [...(state.cards[listId] || []), card],
        },
      }));
    },
    []
  );

  const handleCardUpdated = useCallback(
    (data) => {
      const updated = data.card || data;
      const cardId = updated._id || updated.id;
      useBoardStore.setState((state) => {
        const newCards = { ...state.cards };
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
    },
    []
  );

  const handleCardMoved = useCallback(
    (data) => {
      const { cardId, fromListId, toListId, position } = data;
      useBoardStore.setState((state) => {
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
    },
    []
  );

  const handleCardDeleted = useCallback(
    (data) => {
      const { cardId, listId } = data;
      useBoardStore.setState((state) => ({
        cards: {
          ...state.cards,
          [listId]: (state.cards[listId] || []).filter(
            (c) => (c._id || c.id) !== cardId
          ),
        },
      }));
    },
    []
  );

  const handleListCreated = useCallback(
    (data) => {
      const list = data.list || data;
      const listId = list._id || list.id;
      useBoardStore.setState((state) => ({
        lists: [...state.lists, list],
        cards: { ...state.cards, [listId]: [] },
      }));
    },
    []
  );

  const handleListUpdated = useCallback(
    (data) => {
      const updated = data.list || data;
      const listId = updated._id || updated.id;
      useBoardStore.setState((state) => ({
        lists: state.lists.map((l) =>
          (l._id || l.id) === listId ? { ...l, ...updated } : l
        ),
      }));
    },
    []
  );

  const handleListDeleted = useCallback(
    (data) => {
      const listId = data.listId || data.id || data;
      useBoardStore.setState((state) => {
        const newCards = { ...state.cards };
        delete newCards[listId];
        return {
          lists: state.lists.filter((l) => (l._id || l.id) !== listId),
          cards: newCards,
        };
      });
    },
    []
  );

  const handlePresenceUpdate = useCallback((data) => {
    setOnlineMembers(data.members || data || []);
  }, []);

  // ── Connection status tracking ───────────────────────────
  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  // ── Join board room & register event listeners ───────────
  useEffect(() => {
    if (!boardId || !isAuthenticated) return;

    // Make sure socket is connected
    if (!socket.connected) {
      socket.connect();
    }

    // Join board room
    socket.emit('board:join', { boardId });

    // Register listeners
    socket.on('card:created', handleCardCreated);
    socket.on('card:updated', handleCardUpdated);
    socket.on('card:moved', handleCardMoved);
    socket.on('card:deleted', handleCardDeleted);
    socket.on('list:created', handleListCreated);
    socket.on('list:updated', handleListUpdated);
    socket.on('list:deleted', handleListDeleted);
    socket.on('presence:update', handlePresenceUpdate);

    return () => {
      // Leave room
      socket.emit('board:leave', { boardId });

      // Remove listeners
      socket.off('card:created', handleCardCreated);
      socket.off('card:updated', handleCardUpdated);
      socket.off('card:moved', handleCardMoved);
      socket.off('card:deleted', handleCardDeleted);
      socket.off('list:created', handleListCreated);
      socket.off('list:updated', handleListUpdated);
      socket.off('list:deleted', handleListDeleted);
      socket.off('presence:update', handlePresenceUpdate);
    };
  }, [
    boardId,
    isAuthenticated,
    handleCardCreated,
    handleCardUpdated,
    handleCardMoved,
    handleCardDeleted,
    handleListCreated,
    handleListUpdated,
    handleListDeleted,
    handlePresenceUpdate,
  ]);

  return { onlineMembers, isConnected };
}
