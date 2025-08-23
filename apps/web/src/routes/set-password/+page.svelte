<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth';
  import { trpc } from '$lib/trpc';

  let userId = '';
  let oneTimeAccessCode = '';
  let newPassword = '';
  let confirmPassword = '';
  let isLoading = false;
  let error = '';

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    userId = urlParams.get('userId') || '';
     oneTimeAccessCode = urlParams.get('code') || ''; 
    
    if (!userId) {
      error = 'Invalid access. User ID is required.';
    }
  });

  async function handleSetPassword() {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      error = 'All fields are required';
      return;
    }

    if (newPassword !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }

    if (newPassword.length < 8) {
      error = 'Password must be at least 8 characters long';
      return;
    }

    isLoading = true;
    error = '';

    try {
      const result = await trpc.auth.setPasswordWithCode.mutate({
        userId,
        oneTimeAccessCode: oneTimeAccessCode.trim(),
        newPassword
      });

      if (result.status === 'PASSWORD_SET') {
        // Cookies are already set by the server, just initialize auth
        await auth.initialize();
        goto('/dashboard');
      }
    } catch (err: any) {
      error = err.message || 'Failed to set password. Please check your access code.';
    } finally {
      isLoading = false;
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleSetPassword();
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-cyan-100 flex items-center justify-center p-4">
  <div class="max-w-md w-full space-y-8">
    <div class="text-center">
      <div class="mx-auto h-16 w-16 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-full flex items-center justify-center mb-6">
        <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243A6 6 0 0121 9z"/>
        </svg>
      </div>
      <h2 class="text-4xl font-bold text-gray-900 mb-2">Set Your Password</h2>
    </div>

    <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
      <form on:submit|preventDefault={handleSetPassword} class="space-y-6">
        {#if error}
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        {/if}

        <div>
          <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            bind:value={newPassword}
            on:keypress={handleKeyPress}
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white/50 backdrop-blur-sm"
            placeholder="Create a secure password"
            disabled={isLoading}
          />
          <p class="mt-1 text-xs text-gray-500">Must be at least 8 characters with uppercase, lowercase, number, and special character</p>
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            bind:value={confirmPassword}
            on:keypress={handleKeyPress}
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white/50 backdrop-blur-sm"
            placeholder="Confirm your password"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
        >
          {#if isLoading}
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Setting password...
          {:else}
            Set Password
          {/if}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          Need help? Contact your administrator
        </p>
      </div>
    </div>
  </div>
</div>