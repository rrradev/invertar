import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { User } from '@repo/types/users';
import { trpc } from '$lib/trpc';

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

const createAuthStore = () => {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    isLoading: true
  });

  let refreshTimeoutId: NodeJS.Timeout | null = null;
  let isInitializing = false;

  return {
    subscribe,
    login: async (username: string, organizationName: string, password: string) => {
      set({ user: null, isLoading: true });
      
      try {
        const result = await trpc.auth.login.mutate({
          username: username.trim(),
          organizationName: organizationName.trim(),
          password
        });

        if (result.status === 'SUCCESS') {
          // User data will be available through cookies, we need to fetch current user
          await refreshUserFromToken();
          startAutoRefresh();
          return result;
        } else if (result.status === 'VALID_ACCESS_CODE') {
          set({ user: null, isLoading: false });
          return result;
        }
      } catch (error) {
        set({ user: null, isLoading: false });
        throw error;
      }
    },
    logout: async () => {
      stopAutoRefresh();
      try {
        await trpc.auth.logout.mutate();
      } catch (error) {
        // Ignore logout errors, clear state anyway
        console.warn('Logout error:', error);
      } finally {
        set({ user: null, isLoading: false });
      }
    },
    setLoading: (isLoading: boolean) => {
      update(state => ({ ...state, isLoading }));
    },
    initialize: async () => {
      if (!browser || isInitializing) return;
      
      // Check if we already have a user loaded
      const currentState = await new Promise<AuthState>((resolve) => {
        const unsubscribe = subscribe((state) => {
          unsubscribe();
          resolve(state);
        });
      });
      
      // If user is already loaded and not loading, no need to reinitialize
      if (currentState.user && !currentState.isLoading) {
        return;
      }
      
      isInitializing = true;
      set({ user: null, isLoading: true });
      
      // Create a timeout that guarantees we clear the loading state
      const timeoutId = setTimeout(() => {
        console.warn('Auth initialization timeout - clearing loading state');
        set({ user: null, isLoading: false });
        isInitializing = false;
      }, 5000);
      
      try {
        console.log('Starting auth initialization...');
        const user = await trpc.auth.getCurrentUser.query();
        
        // Clear timeout since we got a response
        clearTimeout(timeoutId);
        
        console.log('Auth initialization successful, user:', user ? user.username : 'none');
        set({ user, isLoading: false });
        
        // Start auto refresh if user is authenticated
        if (user) {
          startAutoRefresh();
        }
      } catch (error) {
        // Clear timeout since we got a response (even if error)
        clearTimeout(timeoutId);
        
        console.log('Auth initialization failed - user not authenticated:', error.message);
        // User not authenticated or token expired - this is expected
        set({ user: null, isLoading: false });
      } finally {
        isInitializing = false;
      }
    },
    refreshToken: async () => {
      if (!browser) return false;
      
      try {
        const result = await trpc.auth.refreshToken.mutate({});
        if (result.status === 'TOKEN_REFRESHED') {
          await refreshUserFromToken();
          return true;
        }
      } catch (error) {
        console.warn('Token refresh failed:', error);
        stopAutoRefresh();
        set({ user: null, isLoading: false });
        return false;
      }
      return false;
    }
  };

  // Helper function to get user data from token (decode client-side or call API)
  async function refreshUserFromToken() {
    try {
      const user = await trpc.auth.getCurrentUser.query();
      set({ user, isLoading: false });
    } catch (error) {
      // User not authenticated or token expired
      console.debug('User not authenticated:', error);
      set({ user: null, isLoading: false });
    }
  }

  // Start automatic token refresh (every 12 minutes, before 15-minute expiry)
  function startAutoRefresh() {
    stopAutoRefresh(); // Clear any existing timeout
    
    if (browser) {
      // Refresh token every 12 minutes (3 minutes before expiry)
      refreshTimeoutId = setInterval(async () => {
        try {
          const result = await trpc.auth.refreshToken.mutate({});
          if (result.status !== 'TOKEN_REFRESHED') {
            throw new Error('Token refresh failed');
          }
        } catch (error) {
          console.warn('Auto refresh failed:', error);
          stopAutoRefresh();
          set({ user: null, isLoading: false });
        }
      }, 12 * 60 * 1000); // 12 minutes in milliseconds
    }
  }

  // Stop automatic token refresh
  function stopAutoRefresh() {
    if (refreshTimeoutId) {
      clearInterval(refreshTimeoutId);
      refreshTimeoutId = null;
    }
  }
};

export const auth = createAuthStore();