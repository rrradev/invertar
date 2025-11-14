<script lang="ts">
	import { trpc } from '$lib/trpc';
	import { SuccessStatus } from '@repo/types/trpc/successStatus';
	import { Unit, UNIT_LABELS } from '@repo/types/units';
	import Header from '$lib/components/Header.svelte';
	import ShelfSkeleton from '$lib/components/skeletons/ShelfSkeleton.svelte';
	import ShelfItemsSkeleton from '$lib/components/skeletons/ShelfItemsSkeleton.svelte';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	import ItemImage from '$lib/components/ItemImage.svelte';
	import { createLoadingController } from '$lib/utils/loadingState';
	import type { PageData } from './$types';
	import { getLabelStyle } from '$lib/utils/labels';

	interface PageProps {
		data: PageData;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let { data: _ }: PageProps = $props();

	interface Label {
		id: string;
		name: string;
		color: string;
	}

	interface Item {
		id: string;
		name: string;
		description: string | null;
		price: number;
		cost?: number | null;
		quantity: number;
		unit: Unit;
		cloudinaryPublicId?: string | null;
		labels: Label[];
		createdAt: string;
	}

	interface Shelf {
		id: string;
		name: string;
		createdAt: string;
		updatedAt: string;
		lastModifiedBy: string;
		isExpanded: boolean;
		items: Item[];
		// Search and pagination state
		searchQuery?: string;
		currentPage?: number;
		totalPages?: number;
		totalCount?: number;
		hasNextPage?: boolean;
		hasPreviousPage?: boolean;
	}

	let shelves = $state<Shelf[]>([]);
	let labels = $state<Label[]>([]);
	let recentLabels = $state<Label[]>([]);

	// Search state per shelf
	let shelfSearchQueries = $state<Record<string, string>>({});
	let shelfSearchTimeouts = $state<Record<string, number>>({});
	let shelfAbortControllers = $state<Record<string, AbortController>>({});

	// Enhanced loading state with delay and minimum display time
	let showSkeleton = $state(true);
	const loadingController = createLoadingController((show) => (showSkeleton = show), {
		showDelay: 120, // 120ms delay before showing skeleton
		minDisplayTime: 500 // 500ms minimum display time
	});

	let isCreatingShelf = $state(false);
	let isCreatingItem = $state(false);
	let isCreatingLabel = $state(false);
	let showCreateShelfForm = $state(false);
	let showCreateItemForm = $state(false);
	let showCreateLabelForm = $state(false);
	let showAdvancedItemFields = $state(false);
	let showEditItemModal = $state(false);
	let showDeleteConfirmation = $state(false);
	let showLabelDropdown = $state(false);
	let activeLabelSlot = $state<number | null>(null); // 0 or 1 for which label slot is being edited
	let labelSearchQuery = $state('');
	let editingItem: Item | null = $state(null);
	let originalItem: Item | null = $state(null); // Store original values to detect changes
	let isUpdatingItem = $state(false);
	let isDeletingItem = $state(false);
	let quantityInput = $state(0);
	let error = $state('');
	let successMessage = $state('');

	// Track which shelves are currently loading items (for expand/collapse)
	let loadingShelfItems = $state<string[]>([]);

	// Load shelves data
	async function loadShelves() {
		try {
			loadingController.startLoading();
			const result = await trpc.dashboard.getShelvesWithItems.query();
			if (result.status === SuccessStatus.SUCCESS) {
				shelves = result.shelves as Shelf[];
			}
		} catch (err) {
			console.error('Failed to load shelves:', err);
		} finally {
			loadingController.endLoading();
		}
	}

	// Load labels when the component is initialized
	async function loadLabels() {
		try {
			const result = await trpc.dashboard.getLabels.query();
			if (result.status === SuccessStatus.SUCCESS) {
				labels = result.labels as Label[];
			}
		} catch (err) {
			console.error('Failed to load labels:', err);
		}
	}

	// Load recent labels for dropdown
	async function loadRecentLabels() {
		try {
			const result = await trpc.dashboard.getRecentLabels.query();
			if (result.status === SuccessStatus.SUCCESS) {
				recentLabels = result.labels as Label[];
			}
		} catch (err) {
			console.error('Failed to load recent labels:', err);
		}
	}

	let newShelf = $state({
		name: ''
	});

	let newLabel = $state({
		name: '',
		color: '#3B82F6'
	});

	let newItem = $state({
		name: '',
		description: '',
		price: 0,
		cost: 0,
		quantity: 0,
		unit: Unit.PCS,
		shelfId: '',
		cloudinaryPublicId: '',
		selectedLabels: [null, null] as (Label | null)[] // Two slots for labels
	});

	// Toggle shelf expand/collapse state
	async function toggleShelfExpansion(shelfId: string) {
		try {
			const shelf = shelves.find((s) => s.id === shelfId);
			if (!shelf) return;

			const newExpandedState = !shelf.isExpanded;

			// Update local state immediately for UI responsiveness
			const shelfIndex = shelves.findIndex((s) => s.id === shelfId);
			if (shelfIndex !== -1) {
				shelves[shelfIndex].isExpanded = newExpandedState;
			}

			// If expanding, load items with search/pagination
			if (newExpandedState) {
				try {
					// Use search function which handles pagination
					await searchShelfItems(shelfId, 1);
				} catch (err) {
					console.error('Failed to load shelf items:', err);
					error = 'Failed to load shelf items';
					setTimeout(() => (error = ''), 3000);
					// Revert expansion state on error
					if (shelfIndex !== -1) {
						shelves[shelfIndex].isExpanded = false;
					}
					return;
				}
			}

			// Update preference on backend
			await trpc.dashboard.updateShelfPreference.mutate({
				shelfId,
				isExpanded: newExpandedState
			});
		} catch (err) {
			console.error('Failed to toggle shelf expansion:', err);
			error = 'Failed to update shelf state';
			setTimeout(() => (error = ''), 3000);

			// Revert local state on error
			const shelfIndex = shelves.findIndex((s) => s.id === shelfId);
			if (shelfIndex !== -1) {
				shelves[shelfIndex].isExpanded = !shelves[shelfIndex].isExpanded;
			}
		}
	}

	// Search items in a shelf with debounce and pagination
	async function searchShelfItems(shelfId: string, page: number = 1) {
		try {
			const searchQuery = shelfSearchQueries[shelfId] || '';

			// Cancel any ongoing request for this shelf
			if (shelfAbortControllers[shelfId]) {
				shelfAbortControllers[shelfId].abort();
			}

			// Don't search if query is empty string (but allow showing all with undefined)
			const queryToUse = searchQuery.trim() === '' ? undefined : searchQuery;

			// Add to loading state
			loadingShelfItems = [...loadingShelfItems, shelfId];

			const result = await trpc.dashboard.searchShelfItems.query({
				shelfId,
				searchQuery: queryToUse,
				page,
				limit: 10
			});

			if (result.status === SuccessStatus.SUCCESS) {
				// Update the shelf with search results and pagination info
				const shelfIndex = shelves.findIndex((s) => s.id === shelfId);
				if (shelfIndex !== -1) {
					shelves[shelfIndex] = {
						...shelves[shelfIndex],
						items: result.items as Item[],
						searchQuery,
						currentPage: result.pagination.page,
						totalPages: result.pagination.totalPages,
						totalCount: result.pagination.totalCount,
						hasNextPage: result.pagination.hasNextPage,
						hasPreviousPage: result.pagination.hasPreviousPage
					};
				}
			}
		} catch (err: any) {
			// Ignore abort errors
			if (err?.name !== 'AbortError') {
				console.error('Failed to search shelf items:', err);
				error = 'Failed to search items';
				setTimeout(() => (error = ''), 3000);
			}
		} finally {
			loadingShelfItems = loadingShelfItems.filter((id) => id !== shelfId);
		}
	}

	// Handle search input with debounce
	function handleSearchInput(shelfId: string, query: string) {
		shelfSearchQueries[shelfId] = query;

		// Clear existing timeout
		if (shelfSearchTimeouts[shelfId]) {
			clearTimeout(shelfSearchTimeouts[shelfId]);
		}

		// Set new timeout for debounce (250ms)
		shelfSearchTimeouts[shelfId] = setTimeout(() => {
			searchShelfItems(shelfId, 1);
		}, 250) as unknown as number;
	}

	// Navigate to a specific page
	function goToPage(shelfId: string, page: number) {
		const shelf = shelves.find((s) => s.id === shelfId);
		if (!shelf) return;

		if (page >= 1 && page <= (shelf.totalPages || 1)) {
			searchShelfItems(shelfId, page);
		}
	}

	// Load data on mount
	loadShelves();
	loadLabels();
	loadRecentLabels();

	// Open label dropdown for a specific slot
	function openLabelDropdown(slotIndex: number) {
		activeLabelSlot = slotIndex;
		showLabelDropdown = true;
		labelSearchQuery = '';
		// Refresh both label arrays when opening dropdown to ensure consistency
		loadLabels();
		loadRecentLabels();
	}

	// Close label dropdown
	function closeLabelDropdown() {
		showLabelDropdown = false;
		activeLabelSlot = null;
		labelSearchQuery = '';
	}

	// Select a label for the active slot
	function selectLabel(label: Label) {
		if (activeLabelSlot !== null) {
			// Check if this label is already selected in the other slot
			const otherSlot = activeLabelSlot === 0 ? 1 : 0;
			if (newItem.selectedLabels[otherSlot]?.id === label.id) {
				error = 'This label is already selected. Please choose a different label.';
				return;
			}

			newItem.selectedLabels[activeLabelSlot] = label;
			closeLabelDropdown();
			error = ''; // Clear any existing error
		}
	}

	// Remove a label from a slot
	// Get filtered labels based on search query
	function getFilteredLabels(): Label[] {
		// Always exclude already selected labels first
		const availableLabels = labels.filter(
			(label) => !newItem.selectedLabels.some((selectedLabel) => selectedLabel?.id === label.id)
		);

		if (!labelSearchQuery.trim()) {
			// No search query: return recent labels that are also available (not selected)
			return recentLabels.filter(
				(label) => !newItem.selectedLabels.some((selectedLabel) => selectedLabel?.id === label.id)
			);
		}

		// With search query: search through all available labels
		return availableLabels.filter((label) =>
			label.name.toLowerCase().includes(labelSearchQuery.toLowerCase())
		);
	}

	async function createLabel() {
		if (!newLabel.name.trim()) {
			error = 'Label name is required';
			return;
		}

		try {
			isCreatingLabel = true;
			error = '';
			successMessage = '';

			const result = await trpc.dashboard.createLabel.mutate({
				name: newLabel.name.trim(),
				color: newLabel.color
			});

			if (result.status === SuccessStatus.SUCCESS) {
				successMessage = result.message;
				newLabel = { name: '', color: '#3B82F6' };
				showCreateLabelForm = false;

				// Add the new label to the labels array
				labels = [result.label as Label, ...labels];
				// Also refresh recent labels to include the newly created label
				loadRecentLabels();
			}
		} catch (err: unknown) {
			error = (err as Error).message || 'Failed to create label';
		} finally {
			isCreatingLabel = false;
		}
	}

	async function createShelf() {
		if (!newShelf.name.trim()) {
			error = 'Shelf name is required';
			return;
		}

		try {
			isCreatingShelf = true;
			error = '';
			successMessage = '';

			const result = await trpc.dashboard.createShelf.mutate({
				name: newShelf.name.trim()
			});

			if (result.status === SuccessStatus.SUCCESS) {
				successMessage = result.message;
				newShelf = { name: '' };
				showCreateShelfForm = false;

				// Add the new shelf to the existing shelves array
				shelves = [result.shelf as Shelf, ...shelves];
			}
		} catch (err: unknown) {
			error = (err as Error).message || 'Failed to create shelf';
		} finally {
			isCreatingShelf = false;
		}
	}

	async function createItem() {
		if (!newItem.name.trim() || !newItem.shelfId) {
			error = 'Item name and shelf selection are required';
			return;
		}

		try {
			isCreatingItem = true;
			error = '';
			successMessage = '';

			const targetShelfId = newItem.shelfId; // Store before resetting

			const result = await trpc.dashboard.createItem.mutate({
				name: newItem.name.trim(),
				description: newItem.description.trim() || undefined,
				price: newItem.price || undefined,
				cost: newItem.cost || undefined,
				quantity: newItem.quantity || undefined,
				unit: newItem.unit,
				shelfId: targetShelfId,
				cloudinaryPublicId: newItem.cloudinaryPublicId || undefined,
				labelIds: newItem.selectedLabels.filter((label) => label !== null).map((label) => label!.id)
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
					shelfId: '',
					cloudinaryPublicId: '',
					selectedLabels: [null, null]
				};
				showCreateItemForm = false;

				// Add the new item to the corresponding shelf
				shelves = shelves.map((shelf) => {
					if (shelf.id === targetShelfId) {
						return {
							...shelf,
							items: [result.item as Item, ...shelf.items]
						};
					}
					return shelf;
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

	function getTotalItemsByUnit(items: Item[]): Record<string, string> {
		if (!items || items.length === 0) return {};

		return items.reduce<Record<string, string>>((totals, item) => {
			const prev = totals[item.unit] ? parseFloat(totals[item.unit]) : 0;
			totals[item.unit] = (prev + item.quantity).toFixed(2); // rounds to 2 decimals
			return totals;
		}, {});
	}

	function openEditModal(item: Item) {
		// Create a deep copy manually to avoid structuredClone issues
		editingItem = {
			id: item.id,
			name: item.name,
			description: item.description,
			price: item.price,
			cost: item.cost,
			quantity: item.quantity,
			unit: item.unit,
			labels: item.labels.map((label) => ({ ...label })), // Deep copy labels array
			createdAt: item.createdAt
		};
		// Store original values for change detection
		originalItem = {
			id: item.id,
			name: item.name,
			description: item.description,
			price: item.price,
			cost: item.cost,
			quantity: item.quantity,
			unit: item.unit,
			labels: item.labels.map((label) => ({ ...label })), // Deep copy labels array
			createdAt: item.createdAt
		};
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
			(editingItem.description !== originalItem.description && editingItem.description !== '') ||
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
				cost: editingItem.cost ?? undefined,
				unit: editingItem.unit
			});

			if (updateResult.status === SuccessStatus.SUCCESS) {
				updateItemSuccessful = true;
				// Update the item in the shelves array with new details
				shelves = shelves.map((shelf) => ({
					...shelf,
					items: shelf.items.map((item) =>
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
						// Update the quantity in the shelves array and editingItem
						shelves = shelves.map((shelf) => ({
							...shelf,
							items: shelf.items.map((item) =>
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

				// Remove the item from the shelves array
				shelves = shelves.map((shelf) => ({
					...shelf,
					items: shelf.items.filter((item) => item.id !== editingItem.id)
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
	{#if showSkeleton}
		<!-- Show skeleton while loading -->
		<Header />
		<ShelfSkeleton shelves={3} itemsPerShelf={4} />
	{:else}
		<Header />

		<!-- Main Content -->
		<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<!-- Page Header -->
			<div class="mb-8">
				<div class="sm:flex sm:items-center sm:justify-between">
					<div>
						<h2 class="text-2xl font-bold text-gray-900" data-testid="dashboard-title">
							Dashboard
						</h2>
						<p class="mt-2 text-sm text-gray-700">Manage your inventory shelves and items</p>
					</div>
					<div class="mt-4 sm:mt-0 flex space-x-3">
						<button
							onclick={() => (showCreateShelfForm = !showCreateShelfForm)}
							class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
							data-testid="create-shelf-button"
						>
							<svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 6h18M3 12h18M3 18h18M3 6v12a1 1 0 001 1h16a1 1 0 001-1V6"
								/>
							</svg>
							Create Shelf
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
						<button
							onclick={() => (showCreateLabelForm = !showCreateLabelForm)}
							class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
							data-testid="create-label-button"
						>
							<svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
								/>
							</svg>
							Create Label
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

			<!-- Create Shelf Form -->
			{#if showCreateShelfForm}
				<div
					class="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6"
					data-testid="create-shelf-form"
				>
					<h3 class="text-lg font-medium text-gray-900 mb-4">Create New Shelf</h3>
					<div class="space-y-4">
						<div>
							<label for="shelfName" class="block text-sm font-medium text-gray-700 mb-2"
								>Shelf Name</label
							>
							<input
								id="shelfName"
								type="text"
								bind:value={newShelf.name}
								placeholder="Enter shelf name"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
								disabled={isCreatingShelf}
							/>
						</div>
						<div class="flex justify-end space-x-3">
							<button
								onclick={() => (showCreateShelfForm = false)}
								class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
								disabled={isCreatingShelf}
								data-testid="cancel-shelf-button"
							>
								Cancel
							</button>
							<button
								onclick={createShelf}
								disabled={isCreatingShelf}
								class="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
								data-testid="submit-shelf-button"
							>
								{#if isCreatingShelf}
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
									Create Shelf
								{/if}
							</button>
						</div>
					</div>
				</div>
			{/if}

			<!-- Create Label Form -->
			{#if showCreateLabelForm}
				<div
					class="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6"
					data-testid="create-label-form"
				>
					<h3 class="text-lg font-medium text-gray-900 mb-4">Create New Label</h3>
					<div class="space-y-4">
						<div>
							<label for="labelName" class="block text-sm font-medium text-gray-700 mb-2"
								>Label Name</label
							>
							<input
								id="labelName"
								type="text"
								bind:value={newLabel.name}
								placeholder="Enter label name"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
								disabled={isCreatingLabel}
							/>
						</div>
						<div class="flex items-end space-x-4">
							<div class="flex-shrink-0">
								<label for="labelColor" class="block text-sm font-medium text-gray-700 mb-2"
									>Color</label
								>
								<div class="relative">
									<input
										id="labelColor"
										type="color"
										bind:value={newLabel.color}
										class="h-10 w-16 rounded-md border border-gray-300 cursor-pointer focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
										disabled={isCreatingLabel}
									/>
								</div>
							</div>
							<div class="flex flex-1 justify-end space-x-3">
								<button
									onclick={() => {
										showCreateLabelForm = false;
										newLabel = { name: '', color: '#3B82F6' };
									}}
									class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
									disabled={isCreatingLabel}
									data-testid="cancel-label-button"
								>
									Cancel
								</button>
								<button
									onclick={createLabel}
									disabled={isCreatingLabel}
									class="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
									data-testid="submit-label-button"
								>
									{#if isCreatingLabel}
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
										Create Label
									{/if}
								</button>
							</div>
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
					<!-- Image Upload -->
					<div class="mb-4">
						<label class="block text-sm font-medium text-gray-700 mb-2">Item Image</label>
						<ImageUpload
							onImageUploaded={(publicId) => (newItem.cloudinaryPublicId = publicId)}
							currentImagePublicId={newItem.cloudinaryPublicId}
							disabled={isCreatingItem}
						/>
					</div>

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
							<label for="itemShelf" class="block text-sm font-medium text-gray-700 mb-2"
								>Shelf <span class="text-red-500">*</span></label
							>
							<select
								id="itemShelf"
								bind:value={newItem.shelfId}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
								disabled={isCreatingItem}
							>
								<option value="">Select shelf</option>
								{#each shelves as shelf (shelf.id)}
									<option value={shelf.id}>{shelf.name}</option>
								{/each}
							</select>
						</div>
					</div>

					<!-- Labels Selection -->
					<div class="mb-4">
						<div class="flex space-x-4">
							{#each [0, 1] as slotIndex (slotIndex)}
								<div class="relative">
									{#if newItem.selectedLabels[slotIndex]}
										<!-- Selected Label -->
										<button
											type="button"
											onclick={() => openLabelDropdown(slotIndex)}
											disabled={isCreatingItem}
											class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
											style={getLabelStyle(newItem.selectedLabels[slotIndex]!.color)}
										>
											{newItem.selectedLabels[slotIndex]!.name}
										</button>
									{:else}
										<!-- Empty Placeholder -->
										<button
											type="button"
											onclick={() => openLabelDropdown(slotIndex)}
											disabled={isCreatingItem}
											class="inline-flex items-center px-6 py-3 rounded-full text-sm font-medium border-2 border-dashed border-gray-300 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											<svg
												class="w-4 h-4 mr-2"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M12 4v16m8-8H4"
												></path>
											</svg>
											Add Label
										</button>
									{/if}
								</div>
							{/each}
						</div>

						<!-- Label Dropdown -->
						{#if showLabelDropdown && activeLabelSlot !== null}
							<!-- Background Overlay -->
							<div class="fixed inset-0 z-[5]" onclick={closeLabelDropdown}></div>

							<div class="relative mt-2">
								<div
									class="absolute z-10 w-80 bg-white border border-gray-200 rounded-lg shadow-lg"
								>
									<!-- Search Bar -->
									<div class="p-3 border-b border-gray-200">
										<input
											name="labelSearch"
											type="text"
											bind:value={labelSearchQuery}
											placeholder="Search labels..."
											class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
										/>
									</div>

									<!-- Labels List -->
									<div class="max-h-60 overflow-y-auto p-2">
										{#each getFilteredLabels() as label (label.id)}
											<button
												type="button"
												onclick={() => selectLabel(label)}
												class="w-full flex items-center p-2 rounded-md hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
											>
												<div
													class="w-4 h-4 rounded-full mr-3 border border-gray-200"
													style="background-color: {label.color}"
												></div>
												<span class="text-sm text-gray-900 flex-1 text-left">{label.name}</span>
											</button>
										{/each}

										{#if getFilteredLabels().length === 0}
											<div class="p-3 text-sm text-gray-500 text-center">
												{labelSearchQuery
													? 'No labels found matching your search'
													: 'No recent labels available'}
											</div>
										{/if}
									</div>

									<!-- Close Button -->
									<div class="p-3 border-t border-gray-200">
										<button
											type="button"
											onclick={closeLabelDropdown}
											class="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
										>
											Close
										</button>
									</div>
								</div>
							</div>
						{/if}

						{#if labels.length === 0}
							<p class="text-sm text-gray-500 mt-2">
								No labels available. Create labels first to assign them to items.
							</p>
						{/if}
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
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
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
									>Cost</label
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
								<label for="itemUnit" class="block text-sm font-medium text-gray-700 mb-2"
									>Unit</label
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
									shelfId: '',
									selectedLabels: [null, null],
									cloudinaryPublicId: null
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

			<!-- Shelves List -->
			{#if !shelves}
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
					<p class="mt-2 text-sm text-gray-500">Loading shelves and items...</p>
				</div>
			{:else if shelves.length === 0}
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
							d="M3 6h18M3 12h18M3 18h18M3 6v12a1 1 0 001 1h16a1 1 0 001-1V6"
						/>
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-900">No shelves yet</h3>
					<p class="mt-1 text-sm text-gray-500">Get started by creating your first shelf.</p>
					<div class="mt-6">
						<button
							onclick={() => (showCreateShelfForm = true)}
							class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
						>
							<svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 6h18M3 12h18M3 18h18M3 6v12a1 1 0 001 1h16a1 1 0 001-1V6"
								/>
							</svg>
							Create Shelf
						</button>
					</div>
				</div>
			{:else}
				<div class="space-y-6" data-testid="shelves-container">
					{#each shelves as shelf (shelf.id)}
						<div
							class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
							data-testid="shelf-item"
							data-shelf-id={shelf.id}
						>
							<!-- Shelf Header -->
							<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
								<div class="flex items-center justify-between">
									<div class="flex items-center">
										<!-- Expand/Collapse Button -->
										<button
											onclick={() => toggleShelfExpansion(shelf.id)}
											class="mr-2 p-1 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
											data-testid="shelf-expand-button"
											aria-label={shelf.isExpanded ? 'Collapse shelf' : 'Expand shelf'}
										>
											<svg
												class="h-5 w-5 text-gray-600 transform transition-transform duration-200 {shelf.isExpanded
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
												/>
											</svg>
										</button>

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
												d="M3 6h18M3 12h18M3 18h18M3 6v12a1 1 0 001 1h16a1 1 0 001-1V6"
											/>
										</svg>
										<div>
											<h3 class="text-lg font-medium text-gray-900" data-testid="shelf-name">
												{shelf.name}
											</h3>
											<p class="text-sm text-gray-500">
												Created {formatDate(shelf.createdAt)} by {shelf.lastModifiedBy}
											</p>
										</div>
									</div>
									<div class="text-right">
										<div class="text-sm text-gray-500" data-testid="shelf-stats">
											{shelf.isExpanded
												? shelf.totalCount !== undefined
													? shelf.totalCount
													: shelf.items.length
												: '?'} items
											{#if shelf.isExpanded}
												• {Object.entries(getTotalItemsByUnit(shelf.items))
													.map(([unit, total]) => (total ? `${total} ${unit}` : ''))
													.filter(Boolean)
													.join(' • ')}
											{/if}
										</div>
										<div
											class="text-lg font-semibold text-gray-900"
											data-testid="shelf-total-value"
										>
											{shelf.isExpanded ? formatPrice(getTotalValue(shelf.items)) : '---'}
										</div>
									</div>
								</div>
							</div>

							<!-- Items List - Only show when shelf is expanded -->
							{#if shelf.isExpanded}
								<!-- Search Box - Only show if shelf has items or search is active -->
								{#if (shelf.totalCount !== undefined ? shelf.totalCount > 0 : shelf.items.length > 0) || shelfSearchQueries[shelf.id]}
									<div class="px-6 py-4 bg-white border-b border-gray-200">
										<div class="relative">
											<div
												class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
											>
												<svg
													class="h-5 w-5 text-gray-400"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
													/>
												</svg>
											</div>
											<input
												type="text"
												placeholder="Search items..."
												value={shelfSearchQueries[shelf.id] || ''}
												oninput={(e) => handleSearchInput(shelf.id, e.currentTarget.value)}
												class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 shadow-sm hover:shadow-md"
												data-testid="search-items-input"
												data-shelf-id={shelf.id}
											/>
										</div>
									</div>
								{/if}

								<!-- Items Content Area -->
								{#if loadingShelfItems.includes(shelf.id)}
									<!-- Show skeleton while loading items -->
									<ShelfItemsSkeleton rows={3} />
								{:else if shelf.items.length === 0}
									<div class="px-6 py-8 text-center" data-testid="empty-shelf-state">
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
										<p class="mt-2 text-sm text-gray-500">
											{shelfSearchQueries[shelf.id]
												? 'No items match your search'
												: 'No items in this shelf yet'}
										</p>
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
														Labels
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
														Total Value
													</th>
													<th
														class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
													>
														Unit
													</th>
													<th
														class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
													>
														Actions
													</th>
												</tr>
											</thead>
											<tbody class="bg-white divide-y divide-gray-200">
												{#each shelf.items as item (item.id)}
													<tr
														class="hover:bg-gray-50 transition-colors"
														data-testid="item-row"
														data-item-id={item.id}
													>
														<td class="px-6 py-4 whitespace-nowrap">
															<div class="flex items-center gap-2">
																<span
																	class="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-sm font-semibold bg-gradient-to-br from-orange-25 to-amber-50 text-black-200 border border-amber-200 shadow-sm"
																>
																	{item.quantity}x
																</span>
																<ItemImage
																	itemId={item.id}
																	itemName={item.name}
																	cloudinaryPublicId={item.cloudinaryPublicId}
																	size="small"
																/>
																<div class="text-sm font-medium text-gray-900">{item.name}</div>
															</div>
														</td>
														<td class="px-6 py-4 whitespace-nowrap">
															<div class="flex items-center space-x-1">
																{#each item.labels as label (label.id)}
																	<span
																		class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
																		style={getLabelStyle(label.color)}
																	>
																		{label.name}
																	</span>
																{/each}
																{#if item.labels.length === 0}
																	<span class="text-sm text-gray-400">—</span>
																{/if}
															</div>
														</td>
														<td class="px-6 py-4 whitespace-nowrap">
															<div class="text-sm text-gray-900">
																{item.description || '—'}
															</div>
														</td>
														<td class="px-6 py-4 whitespace-nowrap">
															<div class="text-sm text-gray-900">
																{item.cost != null ? formatPrice(item.cost) : '-'}
															</div>
														</td>
														<td class="px-6 py-4 whitespace-nowrap">
															<div class="text-sm text-gray-900">{formatPrice(item.price)}</div>
														</td>
														<td class="px-6 py-4 whitespace-nowrap">
															<div class="text-sm font-semibold text-gray-900">
																{formatPrice(item.price * item.quantity)}
															</div>
														</td>
														<td class="px-6 py-4 whitespace-nowrap">
															<div class="text-sm text-gray-900">{item.unit}</div>
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

									<!-- Pagination Controls -->
									{#if shelf.totalPages && shelf.totalPages > 1}
										<div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
											<div class="flex items-center justify-between">
												<div class="text-sm text-gray-700">
													Showing page <span class="font-medium">{shelf.currentPage || 1}</span>
													of{' '}
													<span class="font-medium">{shelf.totalPages}</span>
													<span class="text-gray-500 ml-2">
														({shelf.totalCount || 0} total items)
													</span>
												</div>
												<div class="flex items-center space-x-2">
													<!-- Previous Button -->
													<button
														onclick={() => goToPage(shelf.id, (shelf.currentPage || 1) - 1)}
														disabled={!shelf.hasPreviousPage}
														class="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
														data-testid="prev-page-button"
													>
														<svg
															class="h-4 w-4"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M15 19l-7-7 7-7"
															/>
														</svg>
														Previous
													</button>

													<!-- Page Numbers -->
													{#each Array.from({ length: Math.min(5, shelf.totalPages) }, (_, i) => {
														const current = shelf.currentPage || 1;
														const total = shelf.totalPages || 1;
														let pageNum;

														if (total <= 5) {
															pageNum = i + 1;
														} else if (current <= 3) {
															pageNum = i + 1;
														} else if (current >= total - 2) {
															pageNum = total - 4 + i;
														} else {
															pageNum = current - 2 + i;
														}
														return pageNum;
													}) as pageNum}
														<button
															onclick={() => goToPage(shelf.id, pageNum)}
															class="relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 {pageNum ===
															(shelf.currentPage || 1)
																? 'z-10 bg-indigo-600 border-indigo-600 text-white'
																: 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}"
															data-testid="page-button"
															data-page={pageNum}
														>
															{pageNum}
														</button>
													{/each}

													<!-- Next Button -->
													<button
														onclick={() => goToPage(shelf.id, (shelf.currentPage || 1) + 1)}
														disabled={!shelf.hasNextPage}
														class="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
														data-testid="next-page-button"
													>
														Next
														<svg
															class="h-4 w-4 ml-1"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M9 5l7 7-7 7"
															/>
														</svg>
													</button>
												</div>
											</div>
										</div>
									{/if}
								{/if}
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</main>
	{/if}
</div>

<!-- Edit Item Modal -->
{#if showEditItemModal && editingItem}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div
			class="relative top-4 sm:top-20 mx-auto my-4 sm:my-0 p-4 sm:p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white"
		>
			<div class="mt-1 sm:mt-3">
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
				<div class="space-y-4 sm:space-y-6">
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
								Cost
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
										{quantityChange > 0
											? ` + ${Math.round(quantityChange * 100) / 100}`
											: ` - ${Math.abs(Math.round(quantityChange * 100) / 100)}`}
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
							<div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
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

								<!-- Quantity Input Field -->
								<input
									type="number"
									min="0"
									step="0.01"
									bind:value={quantityInput}
									class="flex-1 min-w-[80px] px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-center"
									disabled={isUpdatingItem || isDeletingItem}
									data-testid="quantity-input"
								/>

								<!-- Increase buttons -->
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
