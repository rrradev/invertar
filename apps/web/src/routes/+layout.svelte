<script lang="ts">
	export let data;
	import { auth } from '$lib/stores/auth';
	import '../app.css';
	import { trpc } from '$lib/trpc';
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/state';
	import { jwtDecode } from 'jwt-decode';
	import type { JWTPayload } from '@repo/types/auth';

	$: auth.set({ user: data.user, isLoading: false });

	onMount(async () => {
		if (!data.user && page.url.pathname !== '/login') {
			const result = await trpc.auth.refreshToken.mutate();
			if (result.status === 'TOKEN_REFRESHED') {
				const user = jwtDecode<JWTPayload>(result.accessToken);
				auth.set({ user, isLoading: false });
			} else {
				auth.reset();
			}
		}
	});

	onDestroy(() => {});
</script>

<slot />
