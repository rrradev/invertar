<script lang="ts">
	import { trpc } from '$lib/trpc';
	import { SuccessStatus } from '@repo/types/trpc/successStatus';
	import { Unit, UNIT_LABELS } from '@repo/types/units';
	import Header from '$lib/components/Header.svelte';
	import type { PageData } from './$types';

	interface PageProps {
		data: PageData;
	}

	let { data }: PageProps = $props();

	interface Item {
		id: string;
		name: string;
		description: string | null;
		price: number;
		cost?: number | null;
		quantity: number;
		unit: Unit;
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

	let folders = $state((data.folders as Folder[]) || []);
	let isCreatingFolder = $state(false);
	let isCreatingItem = $state(false);
	let showCreateFolderForm = $state(false);
	let showCreateItemForm = $state(false);
	let showAdvancedItemFields = $state(false);
	let showEditItemModal = $state(false);
	let showDeleteConfirmation = $state(false);
	let editingItem: Item | null = $state(null);
	let originalItem: Item | null = $state(null); // Store original values to detect changes
	let isUpdatingItem = $state(false);
	let isDeletingItem = $state(false);
	let quantityInput = $state(0);
	let error = $state('');
	let successMessage = $state('');

	let newFolder = $state({
		name: ''
	});

	let newItem = $state({
		name: '',
		description: '',
		price: 0,
		cost: 0,
		quantity: 0,
		unit: Unit.PCS,
		folderId: ''
	});

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

				// Add the new folder to the existing folders array
				folders = [result.folder as Folder, ...folders];
			}
		} catch (err: unknown) {
			error = (err as Error).message || 'Failed to create folder';
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

			const targetFolderId = newItem.folderId; // Store before resetting

			const result = await trpc.dashboard.createItem.mutate({
				name: newItem.name.trim(),
				description: newItem.description.trim() || undefined,
				price: newItem.price || undefined,
				cost: newItem.cost || undefined,
				quantity: newItem.quantity || undefined,
				unit: newItem.unit,
				folderId: targetFolderId
			});

			if (result.status === SuccessStatus.SUCCESS) {
				successMessage = result.message;
				newItem = {
					name: '',
					description: '',
					price: 0,
					cost: 0,
					quantity: 0,
					unit: Unit.PCS,
					folderId: ''
				};
				showCreateItemForm = false;

				// Add the new item to the corresponding folder
				folders = folders.map((folder) => {
					if (folder.id === targetFolderId) {
						return {
							...folder,
							items: [result.item as Item, ...folder.items]
						};
					}
					return folder;
				});
			}
		} catch (err: unknown) {
			error = (err as Error).message || 'Failed to create item';
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

	function openEditModal(item: Item) {
		editingItem = item;
		originalItem = { ...item }; // Store a copy of the original item
		quantityInput = item.quantity;
		showEditItemModal = true;
		showDeleteConfirmation = false;
		error = '';
		successMessage = '';
	}

	function closeEditModal() {
		showEditItemModal = false;
		showDeleteConfirmation = false;
		editingItem = null;
		originalItem = null;
		quantityInput = 0;
		isUpdatingItem = false;
		isDeletingItem = false;
		error = '';
	}

	function adjustQuantityBy(amount: number) {
		if (!editingItem) return;
		const newQuantity = quantityInput + amount;
		if (newQuantity >= 0) {
			// Round to 2 decimal places to avoid floating point precision issues
			quantityInput = Math.round(newQuantity * 100) / 100;
		}
	}

	function hasChanges(): boolean {
		if (!editingItem || !originalItem) return false;

		return (
			editingItem.name !== originalItem.name ||
			(editingItem.description !== originalItem.description || originalItem.description === null) ||
			editingItem.price !== originalItem.price ||
			editingItem.cost !== originalItem.cost ||
			editingItem.unit !== originalItem.unit ||
			quantityInput !== originalItem.quantity
		);
	}

	function confirmDelete() {
		showDeleteConfirmation = true;
	}

	function cancelDelete() {
		showDeleteConfirmation = false;
	}

	async function updateItem() {
		if (!editingItem) return;

		if (!editingItem.name.trim()) {
			error = 'Item name is required';
			return;
		}

		let updateItemTriggered = false;
		let updateItemSuccessful = false;
		let adjustQuantityTriggered = false;
		let adjustItemQuantitySuccessful = false;
		try {
			isUpdatingItem = true;
			error = '';
			successMessage = '';

			// First update the item details
			updateItemTriggered = true;
			const updateResult = await trpc.dashboard.updateItem.mutate({
				itemId: editingItem.id,
				name: editingItem.name.trim(),
				description: editingItem.description?.trim() || undefined,
				price: editingItem.price || 0,
				cost: editingItem.cost || undefined,
				unit: editingItem.unit
			});

			if (updateResult.status === SuccessStatus.SUCCESS) {
				updateItemSuccessful = true;
				// Update the item in the folders array with new details
				folders = folders.map((folder) => ({
					...folder,
					items: folder.items.map((item) =>
						item.id === editingItem.id ? { ...item, ...editingItem } : item
					)
				}));

				// If quantity has changed, update it separately
				if (quantityInput !== editingItem.quantity) {
					const quantityAdjustment = quantityInput - editingItem.quantity;
					adjustQuantityTriggered = true;
					const quantityResult = await trpc.dashboard.adjustItemQuantity.mutate({
						itemId: editingItem.id,
						adjustment: quantityAdjustment
					});

					if (quantityResult.status === SuccessStatus.SUCCESS) {
						adjustItemQuantitySuccessful = true;
						// Update the quantity in the folders array and editingItem
						folders = folders.map((folder) => ({
							...folder,
							items: folder.items.map((item) =>
								item.id === editingItem.id
									? { ...item, quantity: quantityResult.newQuantity }
									: item
							)
						}));

						if (editingItem) {
							editingItem.quantity = quantityResult.newQuantity;
						}
					}
				}

				successMessage = updateResult.message;
			}
		} catch (err: unknown) {
			console.error('Error updating item:', err);
			error = (err as Error).message || 'Failed to update item. Please try again.';
		} finally {
			isUpdatingItem = false;
		}

		// Only close modal if all required actions succeeded
		const shouldCloseModal =
			(!updateItemTriggered || updateItemSuccessful) &&
			(!adjustQuantityTriggered || adjustItemQuantitySuccessful);

		if (shouldCloseModal) {
			closeEditModal();
		}
	}

	async function deleteItem() {
		if (!editingItem) return;

		try {
			isDeletingItem = true;
			showDeleteConfirmation = false; // Close confirmation dialog
			error = '';
			successMessage = '';

			const result = await trpc.dashboard.deleteItem.mutate({
				itemId: editingItem.id
			});

			if (result.status === SuccessStatus.SUCCESS) {
				successMessage = result.message;

				// Remove the item from the folders array
				folders = folders.map((folder) => ({
					...folder,
					items: folder.items.filter((item) => item.id !== editingItem.id)
				}));

				closeEditModal();
			}
		} catch (err: unknown) {
			console.error('Error deleting item:', err);
			error = (err as Error).message || 'Failed to delete item. Please try again.';
		} finally {
			isDeletingItem = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<Header />

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<!-- Page Header -->
		<div class="mb-8">
			<div class="sm:flex sm:items-center sm:justify-between">
				<div>
					<h2 class="text-2xl font-bold text-gray-900" data-testid="dashboard-title">Dashboard</h2>
					<p class="mt-2 text-sm text-gray-700">Manage your inventory folders and items</p>
				</div>
				<div class="mt-4 sm:mt-0 flex space-x-3">
					<button
						onclick={() => (showCreateFolderForm = !showCreateFolderForm)}
						class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
						data-testid="create-folder-button"
					>
						<svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
							/>
						</svg>
						Create Folder
					</button>
					<button
						onclick={() => (showCreateItemForm = !showCreateItemForm)}
						class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
						data-testid="create-item-button"
					>
						<svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
							/>
						</svg>
						Create Item
					</button>
				</div>
			</div>
		</div>

		<!-- Messages -->
		{#if error}
			<div
				class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
				data-testid="error-message"
			>
				{error}
			</div>
		{/if}

		{#if successMessage}
			<div
				class="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
				data-testid="success-message"
			>
				{successMessage}
			</div>
		{/if}

		<!-- Create Folder Form -->
		{#if showCreateFolderForm}
			<div
				class="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6"
				data-testid="create-folder-form"
			>
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
							onclick={() => (showCreateFolderForm = false)}
							class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
							disabled={isCreatingFolder}
							data-testid="cancel-folder-button"
						>
							Cancel
						</button>
						<button
							onclick={createFolder}
							disabled={isCreatingFolder}
							class="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
							data-testid="submit-folder-button"
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
			<div
				class="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6"
				data-testid="create-item-form"
			>
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
							{#each folders as folder (folder.id)}
								<option value={folder.id}>{folder.name}</option>
							{/each}
						</select>
					</div>
				</div>

				<!-- Optional Advanced Fields Toggle -->
				<div class="mb-4">
					<button
						type="button"
						onclick={() => (showAdvancedItemFields = !showAdvancedItemFields)}
						class="flex items-center text-sm text-indigo-600 hover:text-indigo-700 focus:outline-none focus:underline transition-colors"
						disabled={isCreatingItem}
						data-testid="toggle-advanced-fields"
					>
						<svg
							class="w-4 h-4 mr-1 transform transition-transform {showAdvancedItemFields
								? 'rotate-90'
								: ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"
							></path>
						</svg>
						{showAdvancedItemFields ? 'Hide' : 'Show'} advanced fields
					</button>
				</div>

				<!-- Advanced Fields (Collapsible) -->
				{#if showAdvancedItemFields}
					<div
						class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg"
						data-testid="advanced-fields-container"
					>
						<div>
							<label for="itemDescription" class="block text-sm font-medium text-gray-700 mb-2"
								>Description</label
							>
							<input
								id="itemDescription"
								type="text"
								bind:value={newItem.description}
								placeholder="Enter description"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
								disabled={isCreatingItem}
							/>
						</div>
						<div>
							<label for="itemCost" class="block text-sm font-medium text-gray-700 mb-2"
								>Cost (optional)</label
							>
							<input
								id="itemCost"
								type="number"
								min="0"
								step="0.01"
								bind:value={newItem.cost}
								placeholder="0.00"
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
								step="0.01"
								bind:value={newItem.quantity}
								placeholder="0"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
								disabled={isCreatingItem}
							/>
						</div>
						<div>
							<label for="itemUnit" class="block text-sm font-medium text-gray-700 mb-2">Unit</label
							>
							<select
								id="itemUnit"
								bind:value={newItem.unit}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
								disabled={isCreatingItem}
							>
								{#each Object.values(Unit) as unit (unit)}
									<option value={unit}>{unit} - {UNIT_LABELS[unit]}</option>
								{/each}
							</select>
						</div>
					</div>
				{/if}

				<div class="flex justify-end space-x-3">
					<button
						onclick={() => {
							showCreateItemForm = false;
							showAdvancedItemFields = false;
							newItem = {
								name: '',
								description: '',
								price: 0,
								cost: 0,
								quantity: 0,
								unit: Unit.PCS,
								folderId: ''
							};
						}}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
						disabled={isCreatingItem}
						data-testid="cancel-item-button"
					>
						Cancel
					</button>
					<button
						onclick={createItem}
						disabled={isCreatingItem}
						class="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
						data-testid="submit-item-button"
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
		{#if !folders}
			<div
				class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center"
				data-testid="loading-state"
			>
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
			<div
				class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center"
				data-testid="empty-state"
			>
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
						onclick={() => (showCreateFolderForm = true)}
						class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
					>
						<svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
							/>
						</svg>
						Create Folder
					</button>
				</div>
			</div>
		{:else}
			<div class="space-y-6" data-testid="folders-container">
				{#each folders as folder (folder.id)}
					<div
						class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
						data-testid="folder-item"
						data-folder-id={folder.id}
					>
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
										<h3 class="text-lg font-medium text-gray-900" data-testid="folder-name">
											{folder.name}
										</h3>
										<p class="text-sm text-gray-500">
											Created {formatDate(folder.createdAt)} by {folder.lastModifiedBy}
										</p>
									</div>
								</div>
								<div class="text-right">
									<div class="text-sm text-gray-500" data-testid="folder-stats">
										{folder.items.length} items • {getTotalItems(folder.items)} total quantity
									</div>
									<div class="text-lg font-semibold text-gray-900" data-testid="folder-total-value">
										{formatPrice(getTotalValue(folder.items))}
									</div>
								</div>
							</div>
						</div>

						<!-- Items List -->
						{#if folder.items.length === 0}
							<div class="px-6 py-8 text-center" data-testid="empty-folder-state">
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
								<table class="min-w-full divide-y divide-gray-200" data-testid="items-table">
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
												Cost
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
												Unit
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
											<th
												class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
											>
												Actions
											</th>
										</tr>
									</thead>
									<tbody class="bg-white divide-y divide-gray-200">
										{#each folder.items as item (item.id)}
											<tr
												class="hover:bg-gray-50 transition-colors"
												data-testid="item-row"
												data-item-id={item.id}
											>
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
													<div class="text-sm text-gray-900">
														{item.cost ? formatPrice(item.cost) : '-'}
													</div>
												</td>
												<td class="px-6 py-4 whitespace-nowrap">
													<div class="text-sm text-gray-900">{formatPrice(item.price)}</div>
												</td>
												<td class="px-6 py-4 whitespace-nowrap">
													<div class="text-sm text-gray-900">{item.quantity}</div>
												</td>
												<td class="px-6 py-4 whitespace-nowrap">
													<div class="text-sm text-gray-900">{item.unit}</div>
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
												<td class="px-6 py-4 whitespace-nowrap">
													<button
														onclick={() => openEditModal(item)}
														class="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
														aria-label="Edit item"
														data-testid="edit-item-button"
														data-item-id={item.id}
													>
														<!-- Pencil Icon -->
														<svg
															class="w-4 h-4"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
															/>
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
				{/each}
			</div>
		{/if}
	</main>
</div>

<!-- Edit Item Modal -->
{#if showEditItemModal && editingItem}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
			<div class="mt-3">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-medium text-gray-900" data-testid="edit-modal-title">
						Edit Item
					</h3>
					<button
						onclick={closeEditModal}
						class="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md p-1"
						aria-label="Close modal"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<!-- Error/Success Messages -->
				{#if error}
					<div
						class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
					>
						{error}
					</div>
				{/if}

				{#if successMessage}
					<div
						class="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"
					>
						{successMessage}
					</div>
				{/if}

				<!-- Item Details Form -->
				<div class="space-y-6">
					<!-- Name Field (at top) -->
					<div>
						<label for="editItemName" class="block text-sm font-medium text-gray-700 mb-2">
							Item Name <span class="text-red-500">*</span>
						</label>
						<input
							id="editItemName"
							type="text"
							bind:value={editingItem.name}
							placeholder="Enter item name"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
							disabled={isUpdatingItem || isDeletingItem}
							data-testid="edit-item-name"
						/>
					</div>

					<!-- Description Field -->
					<div>
						<label for="editItemDescription" class="block text-sm font-medium text-gray-700 mb-2">
							Description
						</label>
						<input
							id="editItemDescription"
							type="text"
							bind:value={editingItem.description}
							placeholder="Enter description"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
							disabled={isUpdatingItem || isDeletingItem}
							data-testid="edit-item-description"
						/>
					</div>

					<!-- Grouped Fields (Cost, Price, Unit) -->
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label for="editItemCost" class="block text-sm font-medium text-gray-700 mb-2">
								Cost (optional)
							</label>
							<input
								id="editItemCost"
								type="number"
								min="0"
								step="0.01"
								bind:value={editingItem.cost}
								placeholder="0.00"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
								disabled={isUpdatingItem || isDeletingItem}
								data-testid="edit-item-cost"
							/>
						</div>

						<div>
							<label for="editItemPrice" class="block text-sm font-medium text-gray-700 mb-2">
								Price
							</label>
							<input
								id="editItemPrice"
								type="number"
								min="0"
								step="0.01"
								bind:value={editingItem.price}
								placeholder="0.00"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
								disabled={isUpdatingItem || isDeletingItem}
								data-testid="edit-item-price"
							/>
						</div>

						<div>
							<label for="editItemUnit" class="block text-sm font-medium text-gray-700 mb-2">
								Unit
							</label>
							<select
								id="editItemUnit"
								bind:value={editingItem.unit}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
								disabled={isUpdatingItem || isDeletingItem}
								data-testid="edit-item-unit"
							>
								{#each Object.values(Unit) as unit (unit)}
									<option value={unit}>{unit} - {UNIT_LABELS[unit]}</option>
								{/each}
							</select>
						</div>
					</div>

					<!-- Quantity Section -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2"> Quantity </label>
						<div class="bg-gray-50 p-4 rounded-lg space-y-3">
							<!-- Current Quantity Display with Color Coding -->
							<div class="text-sm">
								{#if quantityInput === editingItem.quantity}
									<span class="text-gray-600">Current Quantity: </span>
									<span class="font-medium" data-testid="current-quantity">
										{editingItem.quantity}
									</span>
								{:else}
									{@const quantityChange = quantityInput - editingItem.quantity}
									<span class="text-gray-600">Current Quantity: </span>
									<span class="font-medium">{editingItem.quantity}</span>
									<span
										class="font-bold {quantityChange > 0 ? 'text-green-600' : 'text-red-600'}"
										data-testid="quantity-change"
									>
										{quantityChange > 0 ? ` + ${Math.round(quantityChange * 100) / 100}` : ` - ${Math.abs(Math.round(quantityChange * 100) / 100)}`}
									</span>
									<span class="text-gray-600"> → </span>
									<span
										class="font-bold {quantityInput > editingItem.quantity
											? 'text-green-600'
											: 'text-red-600'}"
										data-testid="new-quantity"
									>
										{quantityInput}
									</span>
								{/if}
							</div>

							<!-- Quantity Input with Buttons -->
							<div class="flex items-center space-x-2">
								<!-- Decrease buttons -->
								<button
									type="button"
									onclick={() => adjustQuantityBy(-10)}
									disabled={isUpdatingItem || isDeletingItem || quantityInput < 10}
									class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									data-testid="decrease-10-button"
								>
									-10
								</button>
								<button
									type="button"
									onclick={() => adjustQuantityBy(-1)}
									disabled={isUpdatingItem || isDeletingItem || quantityInput < 1}
									class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									data-testid="decrease-1-button"
								>
									-1
								</button>
								<button
									type="button"
									onclick={() => adjustQuantityBy(-0.1)}
									disabled={isUpdatingItem || isDeletingItem || quantityInput < 0.1}
									class="px-2 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									data-testid="decrease-01-button"
								>
									-0.1
								</button>

								<!-- Quantity Input Field -->
								<input
									type="number"
									min="0"
									step="0.01"
									bind:value={quantityInput}
									class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-center"
									disabled={isUpdatingItem || isDeletingItem}
									data-testid="quantity-input"
								/>

								<!-- Increase buttons -->
								<button
									type="button"
									onclick={() => adjustQuantityBy(0.1)}
									disabled={isUpdatingItem || isDeletingItem}
									class="px-2 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									data-testid="increase-01-button"
								>
									+0.1
								</button>
								<button
									type="button"
									onclick={() => adjustQuantityBy(1)}
									disabled={isUpdatingItem || isDeletingItem}
									class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									data-testid="increase-1-button"
								>
									+1
								</button>
								<button
									type="button"
									onclick={() => adjustQuantityBy(10)}
									disabled={isUpdatingItem || isDeletingItem}
									class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									data-testid="increase-10-button"
								>
									+10
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- Modal Actions -->
				<div class="mt-6 flex flex-col sm:flex-row gap-3">
					<button
						onclick={updateItem}
						disabled={isUpdatingItem || isDeletingItem || !hasChanges()}
						class="flex-1 px-4 py-2 text-sm font-medium text-white {hasChanges()
							? 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700'
							: 'bg-gray-400 cursor-not-allowed'} rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
						data-testid="update-item-button"
					>
						{#if isUpdatingItem}
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
							Updating...
						{:else}
							Update Item
						{/if}
					</button>

					<button
						onclick={confirmDelete}
						disabled={isDeletingItem || isUpdatingItem}
						class="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
						data-testid="delete-item-button"
					>
						{#if isDeletingItem}
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
							Deleting...
						{:else}
							Delete Item
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirmation && editingItem}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
			<div class="mt-3 text-center">
				<div
					class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4"
				>
					<svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
				</div>
				<h3 class="text-lg font-medium text-gray-900 mb-2" data-testid="delete-confirmation-title">
					Delete Item
				</h3>
				<p class="text-sm text-gray-500 mb-6">
					Are you sure you want to delete "<span class="font-medium text-gray-900"
						>{editingItem.name}</span
					>"? This action cannot be undone.
				</p>

				<!-- Confirmation Buttons -->
				<div class="flex justify-center space-x-3">
					<button
						onclick={cancelDelete}
						disabled={isDeletingItem}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						data-testid="cancel-delete-button"
					>
						Cancel
					</button>
					<button
						onclick={deleteItem}
						disabled={isDeletingItem}
						class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						data-testid="confirm-delete-button"
					>
						Delete Item
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Custom slider styling */
	.slider::-webkit-slider-thumb {
		appearance: none;
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: #4f46e5;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.slider::-moz-range-thumb {
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: #4f46e5;
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.slider::-webkit-slider-track {
		height: 8px;
		background: linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%);
		border-radius: 4px;
	}

	.slider::-moz-range-track {
		height: 8px;
		background: linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%);
		border-radius: 4px;
		border: none;
	}
</style>
