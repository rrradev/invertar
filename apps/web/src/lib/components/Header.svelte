<script lang="ts">
	import { goto } from '$app/navigation';
	import { trpc } from '$lib/trpc';
	import { auth } from '$lib/stores/auth';
	import { UserRole } from '@repo/types/users';
	import type { User } from '@repo/types/users';

	let user: User | null = null;

	// Subscribe directly to auth store to ensure real-time updates
	$: ({ user } = $auth);

	async function logout() {
		await trpc.auth.logout.mutate();
		auth.reset();
		goto('/login');
	}

	function handleSilhouetteClick() {
		if (!user) return;

		if (user.role === UserRole.SUPER_ADMIN) {
			goto('/admins');
		} else if (user.role === UserRole.ADMIN) {
			goto('/users');
		}
		// USER role doesn't show the button, so this shouldn't happen
	}
</script>

<!-- Header -->
<header class="bg-white shadow-sm border-b border-gray-200">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center h-16">
			<div class="flex items-center space-x-4">
				<div
					class="h-8 w-8 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-lg flex items-center justify-center"
				>
					<svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
						/>
					</svg>
				</div>
				<h1 class="text-xl font-semibold text-gray-900">Invertar</h1>
			</div>

			<div class="flex items-center space-x-4">
				{#if user}
					<div class="flex items-center space-x-3">
						<!-- Role-based Silhouette Button -->
						{#if user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN}
							<button
								on:click={handleSilhouetteClick}
								class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
								title={user.role === UserRole.SUPER_ADMIN ? 'Admin Management' : 'User Management'}
							>
								<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
									/>
								</svg>
							</button>
						{/if}
						<span id="welcome-message" class="text-sm text-gray-700">Welcome, {user.username}</span>
						<button
							on:click={logout}
							class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
						>
							Sign out
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</header>
