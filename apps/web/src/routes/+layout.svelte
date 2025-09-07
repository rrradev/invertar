<script lang="ts">
	export let data;
	import { auth } from '$lib/stores/auth';
	import '../app.css';
	import { trpc } from '$lib/trpc';
	import { page } from '$app/state';
	import { jwtDecode } from 'jwt-decode';
	import type { JWTPayload } from '@repo/types/auth';
	import { SuccessStatus } from '@repo/types/trpc/successStatus';
	import { afterNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import { get } from 'svelte/store';

	$: auth.set({ user: data.user, isLoading: false });

	async function refreshIfNeeded() {
		if (!browser) return;
		const $auth = get(auth);
		if (!$auth.user && page.url.pathname !== '/login') {
			try {
				auth.set({ user: null, isLoading: true });
				const result = await trpc.auth.refreshToken.mutate();

				if (result.status === SuccessStatus.TOKEN_REFRESHED) {
					const user = jwtDecode<JWTPayload>(result.accessToken);
					auth.set({ user, isLoading: false });
				} else {
					auth.reset();
				}
			} catch {
				auth.reset();
			}
		}
	}

	afterNavigate(() => {
		refreshIfNeeded();
	});
</script>

<slot />
