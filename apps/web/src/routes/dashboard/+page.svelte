<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { trpc } from '$lib/trpc';
	import type { User } from '@repo/types/users';
	import { SuccessStatus } from '@repo/types/trpc/successStatus';
	import Header from '$lib/components/Header.svelte';

	interface Item {
		id: string;
		name: string;
		description: string | null;
		price: number;
		quantity: number;
		createdAt: string;
		updatedAt: string;
		lastModifiedBy: string;
	}

	interface Folder {
		id: string;
		name: string;
		createdAt: string;
		updatedAt: string;
		lastModifiedBy: string;
		items: Item[];
	}

	let user: User | null = null;
	let folders: Folder[] = [];
	let isLoading = true;
	let isAuthLoading = true;
	let isCreatingFolder = false;
	let isCreatingItem = false;
	let showCreateFolderForm = false;
	let showCreateItemForm = false;
	let showAdvancedItemFields = false;
	let error = '';
	let successMessage = '';

	let newFolder = {
		name: ''
	};

	let newItem = {
		name: '',
		description: '',
		price: 0,
		quantity: 0,
		folderId: ''
	};

	onMount(() => {
		const unsubscribe = auth.subscribe(({ user: authUser, isLoading }) => {
			user = authUser;
			isAuthLoading = isLoading;

			if (!isLoading && user) {
				loadFoldersAndItems();
			}
		});

		return () => unsubscribe();
	});

	async function loadFoldersAndItems() {
		if (!user) return;

		try {
			isLoading = true;
			error = '';
			const result = await trpc.dashboard.getFoldersWithItems.query();

			if (result.status === SuccessStatus.SUCCESS) {
				folders = result.folders as Folder[];
			}
		} catch (err: any) {
			error = err.message || 'Failed to load folders and items';
		} finally {
			isLoading = false;
		}
	}

	async function createFolder() {
		if (!newFolder.name.trim()) {
			error = 'Folder name is required';
			return;
		}

		try {
			isCreatingFolder = true;
			error = '';
			successMessage = '';

			const result = await trpc.dashboard.createFolder.mutate({
				name: newFolder.name.trim()
			});

			if (result.status === SuccessStatus.SUCCESS) {
				successMessage = result.message;
				newFolder = { name: '' };
				showCreateFolderForm = false;
				await loadFoldersAndItems();
			}
		} catch (err: any) {
			error = err.message || 'Failed to create folder';
		} finally {
			isCreatingFolder = false;
		}
	}

	async function createItem() {
		if (!newItem.name.trim() || !newItem.folderId) {
			error = 'Item name and folder selection are required';
			return;
		}

		try {
			isCreatingItem = true;
			error = '';
			successMessage = '';

			const result = await trpc.dashboard.createItem.mutate({
				name: newItem.name.trim(),
				description: newItem.description.trim() || undefined,
				price: newItem.price || undefined,
				quantity: newItem.quantity || undefined,
				folderId: newItem.folderId
			});

			if (result.status === SuccessStatus.SUCCESS) {
				successMessage = result.message;
				newItem = { name: '', description: '', price: 0, quantity: 0, folderId: '' };
				showCreateItemForm = false;
				await loadFoldersAndItems();
			}
		} catch (err: any) {
			error = err.message || 'Failed to create item';
		} finally {
			isCreatingItem = false;
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

	function formatPrice(price: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(price);
	}

	function getTotalValue(items: Item[]) {
		return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
	}

	function getTotalItems(items: Item[]) {
		return items.reduce((sum, item) => sum + item.quantity, 0);
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
		{:else if user}
			<!-- Page Header -->
			<div class="mb-8">
				<div class="sm:flex sm:items-center sm:justify-between">
					<div>
						<h2 class="text-2xl font-bold text-gray-900">Dashboard</h2>
						<p class="mt-2 text-sm text-gray-700">Manage your inventory folders and items</p>
					</div>
					<div class="mt-4 sm:mt-0 flex space-x-3">
						<button
							on:click={() => (showCreateFolderForm = !showCreateFolderForm)}
							class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
						>
							<svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 6v6m0 0v6m0-6h6m-6 0H6"
								/>
							</svg>
							Create Folder
						</button>
						<button
							on:click={() => (showCreateItemForm = !showCreateItemForm)}
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
							Create Item
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

			<!-- Create Folder Form -->
			{#if showCreateFolderForm}
				<div class="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<h3 class="text-lg font-medium text-gray-900 mb-4">Create New Folder</h3>
					<div class="flex items-end space-x-4">
						<div class="flex-1">
							<label for="folderName" class="block text-sm font-medium text-gray-700 mb-2"
								>Folder Name</label
							>
							<input
								id="folderName"
								type="text"
								bind:value={newFolder.name}
								placeholder="Enter folder name"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
								disabled={isCreatingFolder}
							/>
						</div>
						<div class="flex space-x-3">
							<button
								on:click={() => (showCreateFolderForm = false)}
								class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
								disabled={isCreatingFolder}
							>
								Cancel
							</button>
							<button
								on:click={createFolder}
								disabled={isCreatingFolder}
								class="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
							>
								{#if isCreatingFolder}
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
									Create Folder
								{/if}
							</button>
						</div>
					</div>
				</div>
			{/if}

			<!-- Create Item Form -->
			{#if showCreateItemForm}
				<div class="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<h3 class="text-lg font-medium text-gray-900 mb-4">Create New Item</h3>

					<!-- Essential Fields -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
						<div>
							<label for="itemName" class="block text-sm font-medium text-gray-700 mb-2"
								>Item Name <span class="text-red-500">*</span></label
							>
							<input
								id="itemName"
								type="text"
								bind:value={newItem.name}
								placeholder="Enter item name"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
								disabled={isCreatingItem}
							/>
						</div>
						<div>
							<label for="itemFolder" class="block text-sm font-medium text-gray-700 mb-2"
								>Folder <span class="text-red-500">*</span></label
							>
							<select
								id="itemFolder"
								bind:value={newItem.folderId}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
								disabled={isCreatingItem}
							>
								<option value="">Select folder</option>
								{#each folders as folder}
									<option value={folder.id}>{folder.name}</option>
								{/each}
							</select>
						</div>
					</div>

					<!-- Optional Advanced Fields Toggle -->
					<div class="mb-4">
						<button
							type="button"
							on:click={() => (showAdvancedItemFields = !showAdvancedItemFields)}
							class="flex items-center text-sm text-indigo-600 hover:text-indigo-700 focus:outline-none focus:underline transition-colors"
							disabled={isCreatingItem}
						>
							<svg
								class="w-4 h-4 mr-1 transform transition-transform {showAdvancedItemFields
									? 'rotate-90'
									: ''}"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								></path>
							</svg>
							{showAdvancedItemFields ? 'Hide' : 'Show'} additional details (optional)
						</button>
					</div>

					<!-- Advanced Fields (Collapsible) -->
					{#if showAdvancedItemFields}
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
							<div>
								<label for="itemDescription" class="block text-sm font-medium text-gray-700 mb-2"
									>Description</label
								>
								<input
									id="itemDescription"
									type="text"
									bind:value={newItem.description}
									placeholder="Enter description (optional)"
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
									disabled={isCreatingItem}
								/>
							</div>
							<div>
								<label for="itemPrice" class="block text-sm font-medium text-gray-700 mb-2"
									>Price</label
								>
								<input
									id="itemPrice"
									type="number"
									min="0"
									step="0.01"
									bind:value={newItem.price}
									placeholder="0.00"
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
									disabled={isCreatingItem}
								/>
							</div>
							<div>
								<label for="itemQuantity" class="block text-sm font-medium text-gray-700 mb-2"
									>Quantity</label
								>
								<input
									id="itemQuantity"
									type="number"
									min="0"
									bind:value={newItem.quantity}
									placeholder="0"
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
									disabled={isCreatingItem}
								/>
							</div>
						</div>
					{/if}

					<div class="flex justify-end space-x-3">
						<button
							on:click={() => {
								showCreateItemForm = false;
								showAdvancedItemFields = false;
								newItem = { name: '', description: '', price: 0, quantity: 0, folderId: '' };
							}}
							class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
							disabled={isCreatingItem}
						>
							Cancel
						</button>
						<button
							on:click={createItem}
							disabled={isCreatingItem}
							class="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
						>
							{#if isCreatingItem}
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
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								Creating...
							{:else}
								Create Item
							{/if}
						</button>
					</div>
				</div>
			{/if}

			<!-- Folders List -->
			{#if isLoading}
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
					<svg class="animate-spin mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<p class="mt-2 text-sm text-gray-500">Loading folders and items...</p>
				</div>
			{:else if folders.length === 0}
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
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
							d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
						/>
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-900">No folders yet</h3>
					<p class="mt-1 text-sm text-gray-500">Get started by creating your first folder.</p>
					<div class="mt-6">
						<button
							on:click={() => (showCreateFolderForm = true)}
							class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
						>
							<svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 6v6m0 0v6m0-6h6m-6 0H6"
								/>
							</svg>
							Create Folder
						</button>
					</div>
				</div>
			{:else}
				<div class="space-y-6">
					{#each folders as folder}
						<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
							<!-- Folder Header -->
							<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
								<div class="flex items-center justify-between">
									<div class="flex items-center">
										<svg
											class="h-6 w-6 text-yellow-500 mr-3"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
											/>
										</svg>
										<div>
											<h3 class="text-lg font-medium text-gray-900">{folder.name}</h3>
											<p class="text-sm text-gray-500">
												Created {formatDate(folder.createdAt)} by {folder.lastModifiedBy}
											</p>
										</div>
									</div>
									<div class="text-right">
										<div class="text-sm text-gray-500">
											{folder.items.length} items • {getTotalItems(folder.items)} total quantity
										</div>
										<div class="text-lg font-semibold text-gray-900">
											{formatPrice(getTotalValue(folder.items))}
										</div>
									</div>
								</div>
							</div>

							<!-- Items List -->
							{#if folder.items.length === 0}
								<div class="px-6 py-8 text-center">
									<svg
										class="mx-auto h-8 w-8 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
										/>
									</svg>
									<p class="mt-2 text-sm text-gray-500">No items in this folder yet</p>
								</div>
							{:else}
								<div class="overflow-x-auto">
									<table class="min-w-full divide-y divide-gray-200">
										<thead class="bg-gray-50">
											<tr>
												<th
													class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													Item
												</th>
												<th
													class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													Description
												</th>
												<th
													class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													Price
												</th>
												<th
													class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													Quantity
												</th>
												<th
													class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													Total Value
												</th>
												<th
													class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													Last Modified
												</th>
											</tr>
										</thead>
										<tbody class="bg-white divide-y divide-gray-200">
											{#each folder.items as item}
												<tr class="hover:bg-gray-50 transition-colors">
													<td class="px-6 py-4 whitespace-nowrap">
														<div class="flex items-center">
															<div
																class="h-8 w-8 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-lg flex items-center justify-center mr-3"
															>
																<span class="text-xs font-medium text-white">
																	{item.name.charAt(0).toUpperCase()}
																</span>
															</div>
															<div class="text-sm font-medium text-gray-900">{item.name}</div>
														</div>
													</td>
													<td class="px-6 py-4 whitespace-nowrap">
														<div class="text-sm text-gray-900">
															{item.description || '—'}
														</div>
													</td>
													<td class="px-6 py-4 whitespace-nowrap">
														<div class="text-sm text-gray-900">{formatPrice(item.price)}</div>
													</td>
													<td class="px-6 py-4 whitespace-nowrap">
														<div class="text-sm text-gray-900">{item.quantity}</div>
													</td>
													<td class="px-6 py-4 whitespace-nowrap">
														<div class="text-sm font-semibold text-gray-900">
															{formatPrice(item.price * item.quantity)}
														</div>
													</td>
													<td class="px-6 py-4 whitespace-nowrap">
														<div class="text-sm text-gray-900">{formatDate(item.updatedAt)}</div>
														<div class="text-xs text-gray-500">by {item.lastModifiedBy}</div>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		{:else}
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
				<p class="mt-1 text-sm text-gray-500">Please log in to access the dashboard.</p>
			</div>
		{/if}
	</main>
</div>
