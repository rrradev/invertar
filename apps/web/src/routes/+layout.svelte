<script lang="ts">
	import '../app.css';
	import { navigating } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { trpc } from '$lib/trpc';
	import { user } from '$lib/stores/user';
	import { get } from 'svelte/store';
	import type { LayoutData } from './$types';

	interface LayoutProps {
		data: LayoutData;
		children: any;
	}

	let { data, children }: LayoutProps = $props();

	let isAuthLoading = $state(true);
	let authError = $state('');

	onMount(async () => {
		await handleAuth();
	});

	async function handleAuth() {
		try {
			isAuthLoading = true;
			authError = '';

			// Check if user already exists in store
			const currentUser = get(user);
			
			if (currentUser) {
				// User already loaded, no need to call profile again
				isAuthLoading = false;
				return;
			}

			// Determine if current route requires auth
			const currentPath = data.currentPath;
			const isAuthRoute = currentPath === '/login' || currentPath === '/set-password';
			const isRootRoute = currentPath === '/';

			if (isAuthRoute) {
				// On auth pages, don't call profile
				isAuthLoading = false;
				return;
			}

			// For protected routes or root, check auth
			try {
				const profileResult = await trpc.auth.profile.query();
				
				// Set user store with profile data
				user.set({
					username: profileResult.username,
					organizationName: profileResult.organizationName,
					role: profileResult.role
				});

				// If on root page, redirect to dashboard
				if (isRootRoute) {
					await goto('/dashboard');
				}
			} catch (error: any) {
				// Auth failed - redirect to login unless already on auth page
				if (!isAuthRoute) {
					await goto('/login');
				}
			}
		} catch (error: any) {
			authError = 'Authentication failed';
			console.error('Auth error:', error);
		} finally {
			isAuthLoading = false;
		}
	}
</script>

<!-- Auth Loading Overlay -->
{#if isAuthLoading}
	<div class="fixed inset-0 z-50 bg-white bg-opacity-95 backdrop-blur-sm flex items-center justify-center">
		<div class="flex flex-col items-center space-y-4">
			<!-- Elegant Loading Spinner with Gradient -->
			<div class="relative">
				<div class="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
				<div
					class="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-600 border-r-cyan-600 rounded-full animate-spin"
				></div>
			</div>
			<!-- Loading Text with Branding -->
			<div class="text-center">
				<div class="text-gray-700 font-medium text-lg">Loading...</div>
				<div class="text-gray-500 text-sm mt-1">Checking authentication</div>
			</div>
		</div>
	</div>
{/if}

<!-- Navigation Loading Overlay (separate from auth loading) -->
{#if $navigating && !isAuthLoading}
	<div class="fixed inset-0 z-50 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center">
		<div class="flex flex-col items-center space-y-4">
			<!-- Elegant Loading Spinner with Gradient -->
			<div class="relative">
				<div class="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
				<div
					class="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-600 border-r-cyan-600 rounded-full animate-spin"
				></div>
			</div>
			<!-- Loading Text with Branding -->
			<div class="text-center">
				<div class="text-gray-700 font-medium text-lg">Loading...</div>
				<div class="text-gray-500 text-sm mt-1">Please wait while we load your content</div>
			</div>
		</div>
	</div>
{/if}

{#if authError}
	<div class="fixed inset-0 z-50 bg-red-50 flex items-center justify-center">
		<div class="text-center">
			<div class="text-red-600 font-medium text-lg">{authError}</div>
		</div>
	</div>
{/if}

{#if !isAuthLoading && !authError}
	{@render children()}
{/if}
