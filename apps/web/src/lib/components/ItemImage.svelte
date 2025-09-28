<script lang="ts">
	import { trpc } from '$lib/trpc';

	export let itemId: string;
	export let itemName: string;
	export let cloudinaryPublicId: string | null;
	export let size: 'small' | 'medium' = 'small';

	let imageUrl = '';
	let imageError = false;
	let loading = false;

	// Get the appropriate CSS classes for size
	$: sizeClasses = size === 'small' ? 'h-8 w-8' : 'h-12 w-12';

	// Load image URL when component mounts or when cloudinaryPublicId changes
	$: if (cloudinaryPublicId) {
		loadImageUrl();
	}

	async function loadImageUrl() {
		if (!cloudinaryPublicId) return;

		try {
			loading = true;
			imageError = false;

			const response = await trpc.images.getItemImages.query({
				itemIds: [itemId]
			});

			if (response.status === 'SUCCESS' && response.imageUrls[itemId]) {
				imageUrl =
					size === 'small'
						? response.imageUrls[itemId].thumbnail
						: response.imageUrls[itemId].medium;
			}
		} catch (error) {
			console.error('Failed to load image URL:', error);
			imageError = true;
		} finally {
			loading = false;
		}
	}

	function handleImageError() {
		imageError = true;
	}

	function handleImageLoad() {
		imageError = false;
	}
</script>

<div class="{sizeClasses} rounded-lg flex items-center justify-center mr-3 overflow-hidden">
	{#if loading}
		<!-- Loading state -->
		<div
			class="w-full h-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center"
		>
			<svg class="w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
		</div>
	{:else if imageUrl && !imageError}
		<!-- Actual image -->
		<img
			src={imageUrl}
			alt={itemName}
			class="w-full h-full object-cover rounded-lg"
			on:error={handleImageError}
			on:load={handleImageLoad}
		/>
	{:else}
		<!-- Fallback: Show first letter of item name with gradient background -->
		<div
			class="w-full h-full bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-lg flex items-center justify-center"
		>
			<span class="text-xs font-medium text-white">
				{itemName.charAt(0).toUpperCase()}
			</span>
		</div>
	{/if}
</div>
