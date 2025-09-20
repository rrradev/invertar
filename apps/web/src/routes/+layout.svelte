<script lang="ts">
	import '../app.css';
	import { navigating } from '$app/stores';

	interface LayoutProps {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		children: any;
	}

	let { children }: LayoutProps = $props();
</script>

<!-- Navigation Loading Overlay -->
{#if $navigating}
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
