import { create } from 'zustand';

const useUiStore = create((set) => ({
  // ── State ──────────────────────────────────────────────
  activeCardId: null,
  sidebarOpen: true,
  commandPaletteOpen: false,

  // ── Actions ────────────────────────────────────────────

  /**
   * Open the card detail modal/panel for a given card ID.
   */
  openCard: (id) => set({ activeCardId: id }),

  /**
   * Close the card detail modal/panel.
   */
  closeCard: () => set({ activeCardId: null }),

  /**
   * Toggle the sidebar open/closed.
   */
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  /**
   * Open the command palette (⌘K).
   */
  openCommandPalette: () => set({ commandPaletteOpen: true }),

  /**
   * Close the command palette.
   */
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
}));

export default useUiStore;
