<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';

	let { children } = $props();

	onMount(() => {
		auth.initialize();
	});
</script>

{@render children()}
