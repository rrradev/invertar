<script lang="ts">
	import { trpc } from '$lib/trpc';
	import type { Admin } from '@repo/types/users';
	import { SuccessStatus } from '@repo/types/trpc/successStatus';
	import Header from '$lib/components/Header.svelte';
	import type { PageData } from './$types';
	import { loading } from '$lib/stores/loading';

	interface PageProps {
		data: PageData;
	}

	let { data }: PageProps = $props();

	let admins = $state(data.admins as Admin[] || []);
	let isLoading = $state(false);
	let isCreating = $state(false);
	let isDeleting = $state('');
	let isRefreshing = $state('');
	let isResetting = $state('');
	let showCreateForm = $state(false);
	let showDeleteModal = $state(false);
	let showResetModal = $state(false);
	let adminToDelete: Admin | null = $state(null);
	let adminToReset: Admin | null = $state(null);
	let openDropdown: string | null = $state(null);
	let dropdownPosition = $state({ top: 0, left: 0 });
	let error = $state('');
	let successMessage = $state('');

	let newAdmin = $state({
		username: '',
		email: '',
		organizationName: ''
	});


	async function loadAdmins() {
		try {
			isLoading = true;
			error = '';
			const result = await trpc.superAdmin.listAdmins.query();

			if (result.status === SuccessStatus.SUCCESS) {
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

			if (result.status === SuccessStatus.ADMIN_CREATED) {
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

	function confirmDeleteAdmin(admin: Admin) {
		adminToDelete = admin;
		showDeleteModal = true;
		openDropdown = null;
	}

	function confirmResetAdmin(admin: Admin) {
		adminToReset = admin;
		showResetModal = true;
		openDropdown = null;
	}

	function toggleDropdown(adminId: string, event: MouseEvent) {
		const buttonElement = event.currentTarget as HTMLElement;

		if (openDropdown === adminId) {
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
		openDropdown = adminId;
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

	async function deleteAdmin() {
		if (!adminToDelete) return;

		try {
			isDeleting = adminToDelete.id;
			error = '';
			successMessage = '';

			const result = await trpc.superAdmin.deleteAdmin.mutate({
				adminId: adminToDelete.id
			});

			if (result.status === 'ADMIN_DELETED') {
				successMessage = result.message;
				showDeleteModal = false;
				adminToDelete = null;
				await loadAdmins();
			}
		} catch (err: any) {
			error = err.message || 'Failed to delete admin';
		} finally {
			isDeleting = '';
		}
	}

	async function refreshOTAC(admin: Admin) {
		try {
			isRefreshing = admin.id;
			error = '';
			successMessage = '';
			openDropdown = null;

			const result = await trpc.superAdmin.refreshOTAC.mutate({
				adminId: admin.id
			});

			if (result.status === 'OTAC_REFRESHED') {
				successMessage = `${result.message} New code: ${result.oneTimeAccessCode}`;
				await loadAdmins();
			}
		} catch (err: any) {
			error = err.message || 'Failed to refresh OTAC';
		} finally {
			isRefreshing = '';
		}
	}

	async function resetAdmin() {
		if (!adminToReset) return;

		try {
			isResetting = adminToReset.id;
			error = '';
			successMessage = '';

			const result = await trpc.superAdmin.resetAdmin.mutate({
				adminId: adminToReset.id
			});

			if (result.status === 'ADMIN_RESET') {
				successMessage = `${result.message} New OTAC: ${result.oneTimeAccessCode}`;
				showResetModal = false;
				adminToReset = null;
				await loadAdmins();
			}
		} catch (err: any) {
			error = err.message || 'Failed to reset admin';
		} finally {
			isResetting = '';
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
		{#if isLoading}
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
		{:else}
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
									<th
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Actions
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
											{#if admin.oneTimeAccessCodeExpiry}
												<div class="text-xs text-gray-500 mt-1">
													Expires: {formatDate(admin.oneTimeAccessCodeExpiry)}
												</div>
											{/if}
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											{#if admin.hasInitialPassword && new Date() < new Date(admin.oneTimeAccessCodeExpiry)}
												<span
													class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
												>
													Pending Setup
												</span>
											{:else if admin.oneTimeAccessCodeExpiry && new Date() > new Date(admin.oneTimeAccessCodeExpiry)}
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
													on:click|stopPropagation={(e) => toggleDropdown(admin.id, e)}
													class="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
													aria-expanded={openDropdown === admin.id}
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
		{/if}
	</main>
</div>

<!-- Teleported Dropdown Menu -->
{#if openDropdown}
	{@const currentAdmin = admins.find((admin) => admin.id === openDropdown)}
	{#if currentAdmin}
		<div
			class="fixed z-50 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
			style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px;"
			on:click|stopPropagation
		>
			<div class="py-1" role="menu" aria-orientation="vertical">
				<!-- Delete Action -->
				<button
					on:click={() => confirmDeleteAdmin(currentAdmin)}
					disabled={isDeleting === currentAdmin.id}
					class="group flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					role="menuitem"
				>
					{#if isDeleting === currentAdmin.id}
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
						Delete Admin
					{/if}
				</button>

				<!-- Refresh OTAC Action -->
				<button
					on:click={() => refreshOTAC(currentAdmin)}
					disabled={isRefreshing === currentAdmin.id ||
						(currentAdmin.oneTimeAccessCodeExpiry &&
							new Date() <= new Date(currentAdmin.oneTimeAccessCodeExpiry)) ||
						!currentAdmin.hasInitialPassword}
					class="group flex items-center w-full px-4 py-2 text-sm {currentAdmin.oneTimeAccessCodeExpiry &&
					new Date() <= new Date(currentAdmin.oneTimeAccessCodeExpiry)
						? 'text-gray-400 cursor-not-allowed'
						: 'text-blue-700 hover:bg-blue-50 hover:text-blue-900'} disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					role="menuitem"
				>
					{#if isRefreshing === currentAdmin.id}
						<svg class="animate-spin mr-3 h-4 w-4 text-blue-700" fill="none" viewBox="0 0 24 24">
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
						Refreshing...
					{:else}
						<svg
							class="mr-3 h-4 w-4 {currentAdmin.oneTimeAccessCodeExpiry &&
							new Date() <= new Date(currentAdmin.oneTimeAccessCodeExpiry)
								? 'text-gray-300'
								: 'text-blue-400 group-hover:text-blue-500'}"
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
						Refresh OTAC
					{/if}
				</button>

				<!-- Reset Admin Action -->
				<button
					on:click={() => confirmResetAdmin(currentAdmin)}
					disabled={isResetting === currentAdmin.id}
					class="group flex items-center w-full px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 hover:text-orange-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					role="menuitem"
				>
					{#if isResetting === currentAdmin.id}
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
						Reset Admin
					{/if}
				</button>
			</div>
		</div>
	{/if}
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && adminToDelete}
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
					<h3 class="text-lg font-medium text-center">Delete Administrator</h3>
					<p class="text-sm text-gray-500 text-center mt-2">
						Are you sure you want to delete <strong>{adminToDelete.username}</strong>? This action
						cannot be undone.
					</p>
				</div>
				<div class="flex justify-center space-x-3 mt-4">
					<button
						on:click={() => {
							showDeleteModal = false;
							adminToDelete = null;
						}}
						disabled={isDeleting === adminToDelete.id}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						Cancel
					</button>
					<button
						on:click={deleteAdmin}
						disabled={isDeleting === adminToDelete.id}
						class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{#if isDeleting === adminToDelete.id}
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
{#if showResetModal && adminToReset}
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
					<h3 class="text-lg font-medium text-center">Reset Administrator</h3>
					<p class="text-sm text-gray-500 text-center mt-2">
						Are you sure you want to reset <strong>{adminToReset.username}</strong>? This will clear
						their password and generate a new OTAC. It will take up to 15 mins for the user to be
						reset
					</p>
				</div>
				<div class="flex justify-center space-x-3 mt-4">
					<button
						on:click={() => {
							showResetModal = false;
							adminToReset = null;
						}}
						disabled={isResetting === adminToReset.id}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						Cancel
					</button>
					<button
						on:click={resetAdmin}
						disabled={isResetting === adminToReset.id}
						class="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{#if isResetting === adminToReset.id}
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
							Reset
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
