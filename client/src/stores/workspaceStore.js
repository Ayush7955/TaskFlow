import { create } from 'zustand';
import api from '../utils/api';

const useWorkspaceStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────
  workspaces: [],
  currentWorkspace: null,
  members: [],
  isLoading: false,

  // ── Actions ────────────────────────────────────────────

  /**
   * Fetch all workspaces the current user belongs to.
   */
  fetchWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/workspaces');
      const raw = data.data || data;
      const workspaces = Array.isArray(raw) ? raw : (raw.workspaces || []);
      const current = get().currentWorkspace;
      const matchedCurrent = current ? workspaces.find(w => (w.public_id || w.id) === (current.public_id || current.id)) : null;
      set({ 
        workspaces,
        currentWorkspace: matchedCurrent || workspaces[0] || null
      });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Set the currently active workspace.
   */
  setCurrentWorkspace: (workspace) => {
    set({ currentWorkspace: workspace, members: [] });
  },

  /**
   * Fetch members of a specific workspace.
   */
  fetchWorkspaceMembers: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/workspaces/${workspaceId}/members`);
      const members = data.data || data;
      set({ members: Array.isArray(members) ? members : [] });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Create a new workspace.
   */
  createWorkspace: async (workspaceData) => {
    const { data } = await api.post('/workspaces', workspaceData);
    const newWorkspace = data.data || data;

    set((state) => ({
      workspaces: [...state.workspaces, newWorkspace],
    }));

    return newWorkspace;
  },

  /**
   * Update an existing workspace.
   */
  updateWorkspace: async (id, workspaceData) => {
    const { data } = await api.patch(`/workspaces/${id}`, workspaceData);
    const updated = data.data || data;

    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        (w._id || w.id) === id ? { ...w, ...updated } : w
      ),
      currentWorkspace:
        (state.currentWorkspace?._id || state.currentWorkspace?.id) === id
          ? { ...state.currentWorkspace, ...updated }
          : state.currentWorkspace,
    }));

    return updated;
  },

  /**
   * Invite a member to a workspace by email.
   */
  inviteMember: async (workspaceId, email, role = 'member') => {
    const { data } = await api.post(`/workspaces/${workspaceId}/members`, {
      email,
      role,
    });
    const newMember = data.data || data;

    set((state) => ({
      members: [...state.members, newMember],
    }));

    return newMember;
  },

  /**
   * Remove a member from a workspace.
   */
  removeMember: async (workspaceId, memberId) => {
    await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);

    set((state) => ({
      members: state.members.filter(
        (m) => (m._id || m.id || m.userId) !== memberId
      ),
    }));
  },
}));

export default useWorkspaceStore;
