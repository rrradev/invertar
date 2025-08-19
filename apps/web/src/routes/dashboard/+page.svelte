<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	import { trpc } from '$lib/trpc';
	import { UserRole } from '@repo/types/users';
	import type { Admin, User } from '@repo/types/users';

	let user: User | null = null;
	let admins: Admin[] = [];
	let isLoading = true;
	let isCreating = false;
	let showCreateForm = false;
	let error = '';
	let successMessage = '';

	let newAdmin = {
		username: '',
		email: '',
		organizationName: ''
	};

	onMount(() => {
		auth.initialize();
		const unsubscribe = auth.subscribe(({ user: authUser }) => {
			user = authUser;
			if (!authUser) {
				goto('/login');
			} else if (authUser.role !== UserRole.SUPER_ADMIN) {
				error = 'Access denied. Super admin privileges required.';
			} else {
				loadAdmins();
			}
		});
		return unsubscribe;
	});

	async function loadAdmins() {
		if (!user || user.role !== UserRole.SUPER_ADMIN) return;

		try {
			isLoading = true;
			error = '';
			const result = await trpc.superAdmin.listAdmins.query();

			if (result.status === 'SUCCESS') {
				admins = result.admins as Admin[];
			}
		} catch (err: any) {
			error = err.message || 'Failed to load admins';
		} finally {
			isLoading = false;
		}
	}

	async function createAdmin() {
		if (!newAdmin.username.trim() || !newAdmin.email.trim() || !newAdmin.organizationName.trim()) {
			error = 'All fields are required';
			return;
		}

		try {
			isCreating = true;
			error = '';
			successMessage = '';

			const result = await trpc.superAdmin.createAdmin.mutate({
				username: newAdmin.username.trim(),
				email: newAdmin.email.trim(),
				organizationName: newAdmin.organizationName.trim()
			});

			if (result.status === 'ADMIN_CREATED') {
				successMessage = `Admin ${result.username} created successfully! Access code: ${result.oneTimeAccessCode}`;
				newAdmin = { username: '', email: '', organizationName: '' };
				showCreateForm = false;
				await loadAdmins();
			}
		} catch (err: any) {
			error = err.message || 'Failed to create admin';
		} finally {
			isCreating = false;
		}
	}

	function logout() {
		auth.logout();
		goto('/login');
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="min-h-screen bg-gray-50">
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
							<span class="text-sm text-gray-700">Welcome, {user.username}</span>
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

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{#if user && user.role === UserRole.SUPER_ADMIN}
			<!-- Page Header -->
			<div class="mb-8">
				<div class="sm:flex sm:items-center sm:justify-between">
					<div>
						<h2 class="text-2xl font-bold text-gray-900">Admin Management</h2>
						<p class="mt-2 text-sm text-gray-700">Manage administrators in your app</p>
					</div>
					<div class="mt-4 sm:mt-0">
						<button
							on:click={() => (showCreateForm = !showCreateForm)}
							class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
						>
							<svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 6v6m0 0v6m0-6h6m-6 0H6"
								/>
							</svg>
							Create Admin
						</button>
					</div>
				</div>
			</div>

			<!-- Messages -->
			{#if error}
				<div class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
					{error}
				</div>
			{/if}

			{#if successMessage}
				<div class="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
					{successMessage}
				</div>
			{/if}

			<!-- Create Admin Form -->
			{#if showCreateForm}
				<div class="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<h3 class="text-lg font-medium text-gray-900 mb-4">Create New Admin</h3>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label for="username" class="block text-sm font-medium text-gray-700 mb-2"
								>Username</label
							>
							<input
								id="username"
								type="text"
								bind:value={newAdmin.username}
								placeholder="Enter username"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
								disabled={isCreating}
							/>
						</div>
						<div>
							<label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
							<input
								id="email"
								type="email"
								bind:value={newAdmin.email}
								placeholder="Enter email"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
								disabled={isCreating}
							/>
						</div>
						<div>
							<label for="organization" class="block text-sm font-medium text-gray-700 mb-2"
								>Organization</label
							>
							<input
								id="organization"
								type="text"
								bind:value={newAdmin.organizationName}
								placeholder="Enter organization name"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
								disabled={isCreating}
							/>
						</div>
					</div>
					<div class="mt-4 flex justify-end space-x-3">
						<button
							on:click={() => (showCreateForm = false)}
							class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
							disabled={isCreating}
						>
							Cancel
						</button>
						<button
							on:click={createAdmin}
							disabled={isCreating}
							class="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
						>
							{#if isCreating}
								<svg
									class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								Creating...
							{:else}
								Create Admin
							{/if}
						</button>
					</div>
				</div>
			{/if}

			<!-- Admins List -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
				<div class="px-6 py-4 border-b border-gray-200">
					<h3 class="text-lg font-medium text-gray-900">Administrators</h3>
					<p class="mt-1 text-sm text-gray-500">A list of all administrators in your app</p>
				</div>

				{#if isLoading}
					<div class="px-6 py-8 text-center">
						<svg class="animate-spin mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						<p class="mt-2 text-sm text-gray-500">Loading administrators...</p>
					</div>
				{:else if admins.length === 0}
					<div class="px-6 py-8 text-center">
						<svg
							class="mx-auto h-12 w-12 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
							/>
						</svg>
						<h3 class="mt-2 text-sm font-medium text-gray-900">No administrators</h3>
						<p class="mt-1 text-sm text-gray-500">Get started by creating a new administrator.</p>
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Administrator
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Email
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Organization
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Created
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										OTAC
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Status
									</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								{#each admins as admin (admin.id)}
									<tr class="hover:bg-gray-50 transition-colors">
										<td class="px-6 py-4 whitespace-nowrap">
											<div class="flex items-center">
												<div
													class="h-10 w-10 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-full flex items-center justify-center"
												>
													<span class="text-sm font-medium text-white"
														>{admin.username.charAt(0).toUpperCase()}</span
													>
												</div>
												<div class="ml-4">
													<div class="text-sm font-medium text-gray-900">{admin.username}</div>
												</div>
											</div>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<div class="text-sm text-gray-900">{admin.email}</div>
										</td>
                    										<td class="px-6 py-4 whitespace-nowrap">
											<div class="text-sm text-gray-900">{admin.organizationName}</div>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<div class="text-sm text-gray-900">{formatDate(admin.createdAt)}</div>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<div class="text-sm text-gray-900">{admin.oneTimeAccessCode}</div>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											{#if admin.hasInitialPassword}
												<span
													class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
												>
													Pending Setup
												</span>
											{:else}
												<span
													class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
												>
													Active
												</span>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		{:else if user}
			<div class="text-center py-12">
				<svg
					class="mx-auto h-12 w-12 text-red-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
					/>
				</svg>
				<h3 class="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
				<p class="mt-1 text-sm text-gray-500">
					You need super admin privileges to access this page.
				</p>
			</div>
		{/if}
	</main>
</div>
