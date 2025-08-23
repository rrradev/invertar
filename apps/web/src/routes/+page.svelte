<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';

	onMount(() => {
		auth.initialize();
		const unsubscribe = auth.subscribe(({ user }) => {
			if (user) {
				goto('/dashboard');
			} else {
				goto('/login');
			}
		});
		return unsubscribe;
	});
</script>

<div class="min-h-screen bg-gray-50 flex items-center justify-center">
	<div class="text-center">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
		<p class="text-gray-600">Loading...</p>
	</div>
</div>
