<script lang="ts">
	import { trpc } from '$lib/trpc';

	export let onImageUploaded: (publicId: string) => void;
	export let currentImagePublicId: string | null = null;
	export let disabled = false;

	let fileInput: HTMLInputElement;
	let uploading = false;
	let uploadProgress = 0;
	let error = '';
	let previewUrl = '';

	// Handle file selection
	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			error = 'Please select an image file';
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			error = 'Image must be smaller than 5MB';
			return;
		}

		await uploadImage(file);
	}

	async function uploadImage(file: File) {
		try {
			uploading = true;
			error = '';
			uploadProgress = 0;

			// Get upload signature from backend
			const signatureResponse = await trpc.images.generateUploadSignature.mutate();

			if (signatureResponse.status !== 'SUCCESS') {
				throw new Error('Failed to get upload signature');
			}

			const { signature, timestamp, api_key, cloud_name, folder } = signatureResponse.signature;

			// Create form data for Cloudinary upload
			const formData = new FormData();
			formData.append('file', file);
			formData.append('signature', signature);
			formData.append('timestamp', timestamp.toString());
			formData.append('api_key', api_key);
			formData.append('folder', folder);

			// Upload to Cloudinary
			const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/upload`;

			const uploadResponse = await fetch(cloudinaryUrl, {
				method: 'POST',
				body: formData
			});

			if (!uploadResponse.ok) {
				throw new Error('Upload failed');
			}

			const result = await uploadResponse.json();

			if (result.error) {
				throw new Error(result.error.message || 'Upload failed');
			}

			// Create preview URL
			previewUrl = URL.createObjectURL(file);

			// Notify parent component
			onImageUploaded(result.public_id);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Upload failed';
		} finally {
			uploading = false;
			uploadProgress = 0;
		}
	}

	function clearImage() {
		previewUrl = '';
		currentImagePublicId = null;
		if (fileInput) {
			fileInput.value = '';
		}
		onImageUploaded('');
	}

	function triggerFileInput() {
		if (!disabled && fileInput) {
			fileInput.click();
		}
	}
</script>

<div class="image-upload-container">
	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		on:change={handleFileSelect}
		class="hidden"
		{disabled}
	/>

	<div class="flex items-center space-x-4">
		<!-- Upload Area -->
		<div class="flex-shrink-0" class:opacity-50={disabled}>
			{#if previewUrl || currentImagePublicId}
				<!-- Image Preview -->
				<div class="relative">
					<div class="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-300">
						{#if previewUrl}
							<img src={previewUrl} alt="Preview" class="w-full h-full object-cover" />
						{:else if currentImagePublicId}
							<!-- Show existing image placeholder - in real app, this would show the actual image -->
							<div
								class="w-full h-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center"
							>
								<span class="text-white text-xs font-medium">IMG</span>
							</div>
						{/if}
					</div>

					{#if !disabled}
						<button
							type="button"
							on:click={clearImage}
							class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
							title="Remove image"
						>
							×
						</button>
					{/if}
				</div>
			{:else}
				<!-- Upload Button -->
				<button
					type="button"
					on:click={triggerFileInput}
					class="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-colors"
					class:cursor-not-allowed={disabled}
					class:hover:border-gray-300={disabled}
					{disabled}
				>
					{#if uploading}
						<svg class="w-6 h-6 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
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
					{:else}
						<svg
							class="w-6 h-6 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6v6m0 0v6m0-6h6m-6 0H6"
							/>
						</svg>
					{/if}
				</button>
			{/if}
		</div>

		<!-- Upload Info -->
		<div class="flex-1 min-w-0">
			{#if uploading}
				<div class="text-sm text-gray-600">Uploading image...</div>
				{#if uploadProgress > 0}
					<div class="w-full bg-gray-200 rounded-full h-2 mt-2">
						<div
							class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
							style="width: {uploadProgress}%"
						></div>
					</div>
				{/if}
			{:else if previewUrl || currentImagePublicId}
				<div class="text-sm text-gray-600">Image ready</div>
				<div class="text-xs text-gray-500 mt-1">Click × to remove</div>
			{:else}
				<div class="text-sm text-gray-600">
					{#if disabled}
						Image upload disabled
					{:else}
						Click to upload image
					{/if}
				</div>
				<div class="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</div>
			{/if}

			{#if error}
				<div class="text-sm text-red-600 mt-2">
					{error}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.image-upload-container {
		@apply w-full;
	}
</style>
