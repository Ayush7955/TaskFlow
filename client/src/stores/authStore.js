import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';
import { connectSocket, disconnectSocket } from '../utils/socket';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── State ────────────────────────────────────────────
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      // ── Internal setter (used by api interceptor) ────────
      setAccessToken: (token) =>
        set({ accessToken: token, isAuthenticated: !!token }),

      // ── Actions ──────────────────────────────────────────

      /**
       * Log in with email + password.
       */
      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        const payload = data.data || data;

        const { user, accessToken, refreshToken } = payload;

        localStorage.setItem('refreshToken', refreshToken);

        set({
          user,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        });

        connectSocket(accessToken);

        return payload;
      },

      /**
       * Register a new account.
       */
      register: async (formData) => {
        const { data } = await api.post('/auth/register', formData);
        const payload = data.data || data;

        const { user, accessToken, refreshToken } = payload;

        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        set({
          user,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        });

        return payload;
      },

      /**
       * Log out — clear state, remove refresh token, disconnect socket.
       */
      logout: () => {
        localStorage.removeItem('refreshToken');
        disconnectSocket();

        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      /**
       * Refresh the access token using the stored refresh token.
       */
      refreshToken: async () => {
        const storedRefreshToken = localStorage.getItem('refreshToken');
        if (!storedRefreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await api.post('/auth/refresh', {
          refreshToken: storedRefreshToken,
        });
        const payload = data.data || data;

        const newAccessToken = payload.accessToken;
        const newRefreshToken = payload.refreshToken;

        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        set({
          accessToken: newAccessToken,
          isAuthenticated: true,
          user: payload.user || get().user,
        });

        return newAccessToken;
      },

      /**
       * Check auth on app load — attempt silent refresh.
       */
      checkAuth: async () => {
        const storedRefreshToken = localStorage.getItem('refreshToken');
        if (!storedRefreshToken) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        try {
          const token = await get().refreshToken();
          connectSocket(token);
        } catch {
          get().logout();
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Update the current user's profile.
       */
      updateProfile: async (profileData) => {
        const { data } = await api.patch('/auth/me', profileData);
        const updatedUser = data.data || data;

        set({ user: updatedUser });
        return updatedUser;
      },
    }),
    {
      name: 'taskflow-auth',
      // Only persist user — keep accessToken in memory only
      partialize: (state) => ({ user: state.user }),
    }
  )
);

export default useAuthStore;
