<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

	let loading = true;

	onMount(() => {
		const unsubscribe = auth.subscribe(($auth) => {
			loading = false;

			if ($auth.user && $auth.user.role === 'SUPER_ADMIN') {
				goto('/dashboard');
			} else if ($auth.user && $auth.user.role === 'ADMIN') {
				goto('/users');
			}
		});

		return () => unsubscribe();
	});
</script>

{#if loading}
	<div class="min-h-screen bg-gray-50 flex items-center justify-center">
		<div class="text-center">
			<div
				class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"
			></div>
			<p class="text-gray-600">Loading...</p>
		</div>
	</div>
{/if}
