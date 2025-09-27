<script lang="ts">
	import '../app.css';
	import { navigating } from '$app/stores';
	import { onMount } from 'svelte';

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
</script>

{@render children()}
