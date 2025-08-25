<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	import { trpc } from '$lib/trpc';
	import { UserRole } from '@repo/types/users';
	import type { User } from '@repo/types/users';
	import { SuccessStatus } from '@repo/types/trpc/successStatus';

	interface UserListItem {
		id: string;
		username: string;
		email: string | null;
		createdAt: string;
		oneTimeAccessCode: string | null;
		oneTimeAccessCodeExpiry: string | null;
		hasInitialPassword: boolean;
	}

	let user: User | null = null;
	let users: UserListItem[] = [];
	let isLoading = true;
	let isAuthLoading = true;
	let isCreating = false;
	let isDeleting = '';
	let isResetting = '';
	let showCreateForm = false;
	let showDeleteModal = false;
	let showResetModal = false;
	let userToDelete: UserListItem | null = null;
	let userToReset: UserListItem | null = null;
	let openDropdown: string | null = null;
	let dropdownPosition = { top: 0, left: 0 };
	let error = '';
	let successMessage = '';

	let newUser = {
		username: '',
		email: ''
	};

	onMount(() => {
		const unsubscribe = auth.subscribe(({ user: authUser, isLoading }) => {
			user = authUser;
			isAuthLoading = isLoading;

			if (!isLoading && user) {
				if (authUser?.role !== UserRole.ADMIN) {
					error = 'Access denied. Admin privileges required.';
				} else {
					loadUsers();
				}
			}
		});

		return () => unsubscribe();
	});

	async function loadUsers() {
		if (!user || user.role !== UserRole.ADMIN) return;

		try {
			isLoading = true;
			error = '';
			const result = await trpc.admin.listUsers.query();

			if (result.status === SuccessStatus.SUCCESS) {
				users = result.users as UserListItem[];
			}
		} catch (err: any) {
			error = err.message || 'Failed to load users';
		} finally {
			isLoading = false;
		}
	}

	async function createUser() {
		if (!newUser.username.trim()) {
			error = 'Username is required';
			return;
		}

		try {
			isCreating = true;
			error = '';
			successMessage = '';

			const result = await trpc.admin.createUser.mutate({
				username: newUser.username.trim(),
				email: newUser.email.trim() || undefined
			});

			if (result.status === SuccessStatus.USER_CREATED) {
				successMessage = `User ${result.username} created successfully! Access code: ${result.oneTimeAccessCode}`;
				newUser = { username: '', email: '' };
				showCreateForm = false;
				await loadUsers();
			}
		} catch (err: any) {
			error = err.message || 'Failed to create user';
		} finally {
			isCreating = false;
		}
	}

	function confirmDeleteUser(userData: UserListItem) {
		userToDelete = userData;
		showDeleteModal = true;
		openDropdown = null;
	}

	function confirmResetUser(userData: UserListItem) {
		userToReset = userData;
		showResetModal = true;
		openDropdown = null;
	}

	async function deleteUser() {
		if (!userToDelete) return;

		try {
			isDeleting = userToDelete.id;
			error = '';
			successMessage = '';

			const result = await trpc.admin.deleteUser.mutate({
				userId: userToDelete.id
			});

			if (result.status === SuccessStatus.USER_DELETED) {
				successMessage = `User ${result.username} deleted successfully`;
				showDeleteModal = false;
				userToDelete = null;
				await loadUsers();
			}
		} catch (err: any) {
			error = err.message || 'Failed to delete user';
		} finally {
			isDeleting = '';
		}
	}

	async function resetUser() {
		if (!userToReset) return;

		try {
			isResetting = userToReset.id;
			error = '';
			successMessage = '';

			const result = await trpc.admin.resetUser.mutate({
				userId: userToReset.id
			});

			if (result.status === SuccessStatus.USER_RESET) {
				successMessage = `User ${result.username} reset successfully! Access code: ${result.oneTimeAccessCode}`;
				showResetModal = false;
				userToReset = null;
				await loadUsers();
			}
		} catch (err: any) {
			error = err.message || 'Failed to reset user';
		} finally {
			isResetting = '';
		}
	}

	function toggleDropdown(userId: string, event: MouseEvent) {
		event.stopPropagation();
		if (openDropdown === userId) {
			openDropdown = null;
		} else {
			const button = event.target as HTMLElement;
			const rect = button.getBoundingClientRect();
			dropdownPosition = {
				top: rect.bottom + window.scrollY,
				left: rect.left + window.scrollX
			};
			openDropdown = userId;
		}
	}

	function closeDropdown() {
		openDropdown = null;
	}
</script>

<svelte:window on:click={closeDropdown} />

<div class="min-h-screen bg-gray-50">
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{#if isAuthLoading}
			<div class="flex items-center justify-center h-64">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		{:else if user && user.role === UserRole.ADMIN}
			<div class="mb-8">
				<h1 class="text-2xl font-bold text-gray-900">User Management</h1>
				<p class="mt-1 text-sm text-gray-600">
					Manage users in your organization
				</p>
			</div>

			{#if error}
				<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
					<div class="flex">
						<svg
							class="flex-shrink-0 h-5 w-5 text-red-400"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd"
							/>
						</svg>
						<div class="ml-3">
							<p class="text-sm text-red-800">{error}</p>
						</div>
					</div>
				</div>
			{/if}

			{#if successMessage}
				<div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
					<div class="flex">
						<svg
							class="flex-shrink-0 h-5 w-5 text-green-400"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						<div class="ml-3">
							<p class="text-sm text-green-800">{successMessage}</p>
						</div>
					</div>
				</div>
			{/if}

			<div class="bg-white shadow rounded-lg">
				<div class="px-4 py-5 sm:p-6">
					<div class="flex justify-between items-center mb-6">
						<h2 class="text-lg font-medium text-gray-900">Users</h2>
						<button
							on:click={() => (showCreateForm = true)}
							class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
						>
							Create User
						</button>
					</div>

					{#if showCreateForm}
						<div class="mb-6 p-4 bg-gray-50 rounded-lg border">
							<h3 class="text-lg font-medium text-gray-900 mb-4">Create New User</h3>
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label for="username" class="block text-sm font-medium text-gray-700">
										Username *
									</label>
									<input
										type="text"
										id="username"
										bind:value={newUser.username}
										class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
										placeholder="Enter username"
										required
									/>
								</div>
								<div>
									<label for="email" class="block text-sm font-medium text-gray-700">
										Email
									</label>
									<input
										type="email"
										id="email"
										bind:value={newUser.email}
										class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
										placeholder="Enter email (optional)"
									/>
								</div>
							</div>
							<div class="mt-4 flex justify-end space-x-3">
								<button
									on:click={() => (showCreateForm = false)}
									class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
								>
									Cancel
								</button>
								<button
									on:click={createUser}
									disabled={isCreating}
									class="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
								>
									{isCreating ? 'Creating...' : 'Create User'}
								</button>
							</div>
						</div>
					{/if}

					{#if isLoading}
						<div class="flex items-center justify-center h-32">
							<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						</div>
					{:else if users.length === 0}
						<div class="text-center py-12">
							<svg
								class="mx-auto h-12 w-12 text-gray-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
								/>
							</svg>
							<h3 class="mt-2 text-sm font-medium text-gray-900">No users</h3>
							<p class="mt-1 text-sm text-gray-500">Get started by creating a new user.</p>
						</div>
					{:else}
						<div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
							<table class="min-w-full divide-y divide-gray-300">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											User
										</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Status
										</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Created
										</th>
										<th class="relative px-6 py-3">
											<span class="sr-only">Actions</span>
										</th>
									</tr>
								</thead>
								<tbody class="bg-white divide-y divide-gray-200">
									{#each users as userData (userData.id)}
										<tr>
											<td class="px-6 py-4 whitespace-nowrap">
												<div>
													<div class="text-sm font-medium text-gray-900">
														{userData.username}
													</div>
													{#if userData.email}
														<div class="text-sm text-gray-500">{userData.email}</div>
													{/if}
												</div>
											</td>
											<td class="px-6 py-4 whitespace-nowrap">
												{#if userData.hasInitialPassword}
													<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
														Needs Setup
													</span>
												{:else}
													<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
														Active
													</span>
												{/if}
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{new Date(userData.createdAt).toLocaleDateString()}
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
												<button
													on:click={(e) => toggleDropdown(userData.id, e)}
													class="text-gray-400 hover:text-gray-600 focus:outline-none"
												>
													<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
														<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
													</svg>
												</button>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			</div>
		{:else if error}
			<div class="text-center">
				<svg
					class="mx-auto h-12 w-12 text-gray-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
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
					You need admin privileges to access this page.
				</p>
			</div>
		{/if}
	</main>
</div>

<!-- Teleported Dropdown Menu -->
{#if openDropdown}
	{@const currentUser = users.find((u) => u.id === openDropdown)}
	{#if currentUser}
		<div
			class="fixed bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50"
			style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px;"
		>
			<div class="py-1">
				<button
					on:click={() => confirmResetUser(currentUser)}
					disabled={isResetting === currentUser.id}
					class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
				>
					{isResetting === currentUser.id ? 'Resetting...' : 'Reset Password'}
				</button>
				<button
					on:click={() => confirmDeleteUser(currentUser)}
					disabled={isDeleting === currentUser.id}
					class="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
				>
					{isDeleting === currentUser.id ? 'Deleting...' : 'Delete User'}
				</button>
			</div>
		</div>
	{/if}
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && userToDelete}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
			<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
			<div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
				<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
					<div class="sm:flex sm:items-start">
						<div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
							<svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
							</svg>
						</div>
						<div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
							<h3 class="text-lg leading-6 font-medium text-gray-900">Delete User</h3>
							<div class="mt-2">
								<p class="text-sm text-gray-500">
									Are you sure you want to delete user "{userToDelete.username}"? This action cannot be undone.
								</p>
							</div>
						</div>
					</div>
				</div>
				<div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
					<button
						on:click={deleteUser}
						disabled={isDeleting === userToDelete.id}
						class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
					>
						{isDeleting === userToDelete.id ? 'Deleting...' : 'Delete'}
					</button>
					<button
						on:click={() => (showDeleteModal = false)}
						class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Reset Confirmation Modal -->
{#if showResetModal && userToReset}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
			<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
			<div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
				<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
					<div class="sm:flex sm:items-start">
						<div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
							<svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
						</div>
						<div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
							<h3 class="text-lg leading-6 font-medium text-gray-900">Reset User Password</h3>
							<div class="mt-2">
								<p class="text-sm text-gray-500">
									Are you sure you want to reset the password for user "{userToReset.username}"? This will generate a new one-time access code.
								</p>
							</div>
						</div>
					</div>
				</div>
				<div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
					<button
						on:click={resetUser}
						disabled={isResetting === userToReset.id}
						class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
					>
						{isResetting === userToReset.id ? 'Resetting...' : 'Reset Password'}
					</button>
					<button
						on:click={() => (showResetModal = false)}
						class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}