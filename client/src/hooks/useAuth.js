import { useEffect } from 'react';
import useAuthStore from '../stores/authStore';

/**
 * Convenience hook for authentication state.
 * On first mount it triggers a silent auth check (token refresh)
 * if one hasn't already been performed.
 */
export default function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    // Only run once — if the store is still in its initial loading state
    // and the user hasn't been resolved yet, kick off a check.
    if (isLoading && !user) {
      checkAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, isAuthenticated, isLoading };
}
