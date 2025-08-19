import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { User } from '@repo/types/users';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

const createAuthStore = () => {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    token: null,
    isLoading: false
  });

  return {
    subscribe,
    login: (token: string, user: User) => {
      if (browser) {
        localStorage.setItem('auth-token', token);
        localStorage.setItem('auth-user', JSON.stringify(user));
      }
      set({ user, token, isLoading: false });
    },
    logout: () => {
      if (browser) {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
      }
      set({ user: null, token: null, isLoading: false });
    },
    setLoading: (isLoading: boolean) => {
      update(state => ({ ...state, isLoading }));
    },
    initialize: () => {
      if (browser) {
        const token = localStorage.getItem('auth-token');
        const userStr = localStorage.getItem('auth-user');
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({ user, token, isLoading: false });
          } catch {
            // Invalid user data, clear storage
            localStorage.removeItem('auth-token');
            localStorage.removeItem('auth-user');
          }
        }
      }
    }
  };
};

export const auth = createAuthStore();