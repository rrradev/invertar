<script lang="ts">
	import '../app.css';
	import { navigating } from '$app/stores';
	import { onMount } from 'svelte';
	import { skeleton } from '$lib/stores/skeleton';

	interface LayoutProps {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		children: any;
	}

	let { children }: LayoutProps = $props();

	onMount(() => {
		// Hide the initial loading indicator when the Svelte app has mounted
		// This ensures we only hide it after the actual SvelteKit app is running
		setTimeout(() => {
			if (window.__hideInitialLoading) {
				window.__hideInitialLoading();
			}
		}, 100);
	});

	// Handle navigation loading states
	$effect(() => {
		if ($navigating) {
			// Determine which skeleton to show based on destination route
			const route = $navigating.to?.route?.id;

			// Reset all skeletons first
			skeleton.hideAllSkeletons();

			// Show appropriate skeleton based on route
			switch (route) {
				case '/dashboard':
					skeleton.showSkeleton('dashboard');
					break;
				case '/users':
					skeleton.showSkeleton('users');
					break;
				case '/admins':
					skeleton.showSkeleton('admins');
					break;
			}
		} else {
			// Navigation completed, hide all skeletons
			setTimeout(() => {
				skeleton.hideAllSkeletons();
			}, 200); // Small delay to allow content to render
		}
	});
</script>

<!-- Minimal navigation loading for non-skeleton pages (login, etc.) -->
{#if $navigating && !['dashboard', 'users', 'admins'].some( (route) => $navigating?.to?.route?.id?.includes(route) )}
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

{@render children()}
