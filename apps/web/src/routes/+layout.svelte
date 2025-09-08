<script lang="ts">
	import '../app.css';
	import { navigating } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { trpc } from '$lib/trpc';
	import { user } from '$lib/stores/user';
	import type { LayoutData } from './$types';

	interface LayoutProps {
		data: LayoutData;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		children: any;
	}

	let { data, children }: LayoutProps = $props();

	let authError = $state('');

	onMount(async () => {
		await handleAuth();
	});

	async function handleAuth() {
		try {
			authError = '';
			user.setLoading(true);

			// Determine if current route requires auth
			const currentPath = data.currentPath;
			const isAuthRoute = currentPath === '/login' || currentPath === '/set-password';
			const isRootRoute = currentPath === '/';

			if (isAuthRoute) {
				// On auth pages, don't call profile and set unauthenticated
				user.setUnauthenticated();
				return;
			}

			// For protected routes or root, check auth
			try {
				const profileResult = await trpc.auth.profile.query();

				// Set user store with profile data
				user.setUser({
					username: profileResult.username,
					organizationName: profileResult.organizationName,
					role: profileResult.role
				});

				// If on root page, redirect to dashboard
				if (isRootRoute) {
					await goto('/dashboard');
				}
			} catch (error: unknown) {
				// Auth failed - set unauthenticated and redirect to login
				user.setUnauthenticated();
				if (!isAuthRoute) {
					await goto('/login');
				}
			}
		} catch (error: unknown) {
			authError = 'Authentication failed';
			user.setUnauthenticated();
			console.error('Auth error:', error);
		}
	}
</script>

<!-- Auth Loading Overlay -->
{#if $user.isLoading}
	<div
		class="fixed inset-0 z-50 bg-white bg-opacity-95 backdrop-blur-sm flex items-center justify-center"
	>
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
{#if $navigating && !$user.isLoading}
	<div
		class="fixed inset-0 z-50 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center"
	>
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

{#if !$user.isLoading && !authError}
	{@render children()}
{/if}
