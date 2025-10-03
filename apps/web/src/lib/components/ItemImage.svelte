<script lang="ts">
	import { trpc } from '$lib/trpc';
	import SkeletonBase from './skeletons/SkeletonBase.svelte';

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
		<!-- Loading state with skeleton shimmer animation -->
		<SkeletonBase width="100%" height="100%" className="absolute inset-0" rounded="lg" />
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
