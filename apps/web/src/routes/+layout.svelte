<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';

	let { children } = $props();
	let hasInitialized = false;

	onMount(() => {
		// Only initialize auth once per page load
		if (!hasInitialized) {
			hasInitialized = true;
			auth.initialize();
		}
	});
</script>

{@render children()}
