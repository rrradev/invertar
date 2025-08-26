<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { trpc } from '$lib/trpc';
	import { UserRole } from '@repo/types/users';
	import type { User } from '@repo/types/users';
	import { SuccessStatus } from '@repo/types/trpc/successStatus';
	import Header from '$lib/components/Header.svelte';

	interface UserListItem {
		id: string;
		username: string;
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
		username: ''
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
				username: newUser.username.trim()
			});

			if (result.status === SuccessStatus.USER_CREATED) {
				successMessage = `User ${result.username} created successfully! Access code: ${result.oneTimeAccessCode}`;
				newUser = { username: '' };
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
		const buttonElement = event.currentTarget as HTMLElement;

		if (openDropdown === userId) {
			openDropdown = null;
			return;
		}

		// Calculate dropdown position
		const rect = buttonElement.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const dropdownWidth = 224; // w-56 = 14rem = 224px
		const dropdownHeight = 150; // Approximate dropdown height

		let top = rect.bottom + 8; // 8px gap
		let left = rect.right - dropdownWidth; // Right align

		// Adjust if dropdown would go off-screen
		if (left < 8) {
			left = 8; // Min 8px from left edge
		}
		if (left + dropdownWidth > viewportWidth - 8) {
			left = viewportWidth - dropdownWidth - 8; // 8px from right edge
		}
		if (top + dropdownHeight > viewportHeight - 8) {
			top = rect.top - dropdownHeight - 8; // Show above button if not enough space below
		}

		dropdownPosition = { top, left };
		openDropdown = userId;
	}

	function closeDropdown() {
		openDropdown = null;
	}

	function handleWindowResize() {
		if (openDropdown) {
			// Close dropdown on resize to prevent positioning issues
			openDropdown = null;
		}
	}

	function handleWindowScroll() {
		if (openDropdown) {
			// Close dropdown on scroll to prevent positioning issues
			openDropdown = null;
		}
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
	<Header />

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{#if isAuthLoading}
			<div class="text-center py-12">
				<svg class="animate-spin mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				<p class="mt-2 text-sm text-gray-500">Loading...</p>
			</div>
		{:else if user && user.role === UserRole.ADMIN}
			<!-- Page Header -->
			<div class="mb-8">
				<div class="sm:flex sm:items-center sm:justify-between">
					<div>
						<h2 class="text-2xl font-bold text-gray-900">User Management</h2>
						<p class="mt-2 text-sm text-gray-700">Manage users in your organization</p>
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
							Create User
						</button>
					</div>
				</div>
			</div>

			<!-- Messages -->
			{#if error}
				<div  id="error-message" class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
					{error}
				</div>
			{/if}

			{#if successMessage}
				<div id="success-message" class="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
					{successMessage}
				</div>
			{/if}

			<!-- Create User Form -->
			{#if showCreateForm}
				<div class="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6" id="create-user-form">
					<h3 class="text-lg font-medium text-gray-900 mb-4">Create New User</h3>
					<div class="grid grid-cols-1 gap-4">
						<div>
							<label for="username" class="block text-sm font-medium text-gray-700 mb-2"
								>Username</label
							>
							<input
								id="username"
								type="text"
								bind:value={newUser.username}
								placeholder="Enter username"
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
							on:click={createUser}
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
								Create User
							{/if}
						</button>
					</div>
				</div>
			{/if}

			<!-- Users List -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
				<div class="px-6 py-4 border-b border-gray-200">
					<h3 class="text-lg font-medium text-gray-900">Users</h3>
					<p class="mt-1 text-sm text-gray-500">Manage users in your organization</p>
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
						<p class="mt-2 text-sm text-gray-500">Loading users...</p>
					</div>
				{:else if users.length === 0}
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
						<h3 class="mt-2 text-sm font-medium text-gray-900">No users</h3>
						<p class="mt-1 text-sm text-gray-500">Get started by creating a new user.</p>
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										User
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
									<th
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Actions
									</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								{#each users as userData (userData.id)}
									<tr class="hover:bg-gray-50 transition-colors">
										<td class="px-6 py-4 whitespace-nowrap">
											<div class="flex items-center">
												<div
													class="h-10 w-10 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-full flex items-center justify-center"
												>
													<span class="text-sm font-medium text-white"
														>{userData.username.charAt(0).toUpperCase()}</span
													>
												</div>
												<div class="ml-4">
													<div class="text-sm font-medium text-gray-900">{userData.username}</div>
												</div>
											</div>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<div class="text-sm text-gray-900">{formatDate(userData.createdAt)}</div>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											{#if userData.oneTimeAccessCode}
												<div class="text-sm text-gray-900 font-mono">{userData.oneTimeAccessCode}</div>
												{#if userData.oneTimeAccessCodeExpiry}
													<div class="text-xs text-gray-500 mt-1">
														Expires: {formatDate(userData.oneTimeAccessCodeExpiry)}
													</div>
												{/if}
											{:else}
												<span class="text-xs text-gray-400">-</span>
											{/if}
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											{#if userData.hasInitialPassword && userData.oneTimeAccessCodeExpiry && new Date() < new Date(userData.oneTimeAccessCodeExpiry)}
												<span
													class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
												>
													Pending Setup
												</span>
											{:else if userData.oneTimeAccessCodeExpiry && new Date() > new Date(userData.oneTimeAccessCodeExpiry)}
												<span
													class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
												>
													OTAC Expired
												</span>
											{:else}
												<span
													class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
												>
													Active
												</span>
											{/if}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
											<div class="relative inline-block text-left">
												<button
													on:click|stopPropagation={(e) => toggleDropdown(userData.id, e)}
													class="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
													aria-expanded={openDropdown === userData.id}
													aria-haspopup="true"
												>
													<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
														<path
															d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"
														/>
													</svg>
												</button>
											</div>
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
			class="fixed z-50 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
			style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px;"
			on:click|stopPropagation
		>
			<div class="py-1" role="menu" aria-orientation="vertical">
				<!-- Delete Action -->
				<button
					on:click={() => confirmDeleteUser(currentUser)}
					disabled={isDeleting === currentUser.id}
					class="group flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					role="menuitem"
				>
					{#if isDeleting === currentUser.id}
						<svg class="animate-spin mr-3 h-4 w-4 text-red-700" fill="none" viewBox="0 0 24 24">
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
						Deleting...
					{:else}
						<svg
							class="mr-3 h-4 w-4 text-red-400 group-hover:text-red-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
						Delete User
					{/if}
				</button>

				<!-- Reset User Action -->
				<button
					on:click={() => confirmResetUser(currentUser)}
					disabled={isResetting === currentUser.id}
					class="group flex items-center w-full px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 hover:text-orange-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					role="menuitem"
				>
					{#if isResetting === currentUser.id}
						<svg class="animate-spin mr-3 h-4 w-4 text-orange-700" fill="none" viewBox="0 0 24 24">
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
						Resetting...
					{:else}
						<svg
							class="mr-3 h-4 w-4 text-orange-400 group-hover:text-orange-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
						Reset User
					{/if}
				</button>
			</div>
		</div>
	{/if}
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && userToDelete}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
			<div class="mt-3">
				<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
					<svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
				</div>
				<div class="mt-2 px-7 py-3">
					<h3 class="text-lg font-medium text-center">Delete User</h3>
					<p class="text-sm text-gray-500 text-center mt-2">
						Are you sure you want to delete <strong>{userToDelete.username}</strong>? This action
						cannot be undone.
					</p>
				</div>
				<div class="flex justify-center space-x-3 mt-4">
					<button
						on:click={() => {
							showDeleteModal = false;
							userToDelete = null;
						}}
						disabled={isDeleting === userToDelete.id}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						Cancel
					</button>
					<button
						on:click={deleteUser}
						disabled={isDeleting === userToDelete.id}
						class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{#if isDeleting === userToDelete.id}
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
							Deleting...
						{:else}
							Delete
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Reset Confirmation Modal -->
{#if showResetModal && userToReset}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
			<div class="mt-3">
				<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
					<svg
						class="h-6 w-6 text-orange-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
				</div>
				<div class="mt-2 px-7 py-3">
					<h3 class="text-lg font-medium text-center">Reset User</h3>
					<p class="text-sm text-gray-500 text-center mt-2">
						Are you sure you want to reset <strong>{userToReset.username}</strong>? This will generate a new one-time access code.
					</p>
				</div>
				<div class="flex justify-center space-x-3 mt-4">
					<button
						on:click={() => {
							showResetModal = false;
							userToReset = null;
						}}
						disabled={isResetting === userToReset.id}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						Cancel
					</button>
					<button
						on:click={resetUser}
						disabled={isResetting === userToReset.id}
						class="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{#if isResetting === userToReset.id}
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
							Resetting...
						{:else}
							Reset User
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Event listeners -->
<svelte:window
	on:click={closeDropdown}
	on:resize={handleWindowResize}
	on:scroll={handleWindowScroll}
/>