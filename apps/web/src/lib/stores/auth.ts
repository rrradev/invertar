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
      console.log('Auth: Logging out...');
      stopAutoRefresh();
      try {
        await trpc.auth.logout.mutate();
        console.log('Auth: Logout API call successful');
      } catch (error) {
        // Ignore logout errors, clear state anyway
        console.warn('Logout error:', error);
      } finally {
        console.log('Auth: Clearing user state');
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
      
      try {
        // Add timeout to prevent infinite loading
        await Promise.race([
          refreshUserFromToken(),
          new Promise<void>((_, reject) => 
            setTimeout(() => reject(new Error('Auth initialization timeout')), 10000)
          )
        ]);
        
        // Only start auto refresh if user is authenticated
        const newState = await new Promise<AuthState>((resolve) => {
          const unsubscribe = subscribe((state) => {
            unsubscribe();
            resolve(state);
          });
        });
        if (newState.user) {
          startAutoRefresh();
        }
      } catch (error) {
        console.warn('Auth initialization failed:', error);
        // Ensure we clear loading state even on error
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
      console.log('Auth: Fetching current user...');
      const user = await trpc.auth.getCurrentUser.query();
      console.log('Auth: User fetched successfully:', user?.username);
      set({ user, isLoading: false });
    } catch (error) {
      // User not authenticated or token expired
      console.log('Auth: User not authenticated:', error);
      set({ user: null, isLoading: false });
    }
  }

  // Start automatic token refresh (every 12 minutes, before 15-minute expiry)
  function startAutoRefresh() {
    stopAutoRefresh(); // Clear any existing timeout
    
    if (browser) {
      // Refresh token every 12 minutes (3 minutes before expiry)
      refreshTimeoutId = setInterval(async () => {
        const success = await trpc.auth.refreshToken.mutate({}).then(() => true).catch(() => false);
        if (!success) {
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