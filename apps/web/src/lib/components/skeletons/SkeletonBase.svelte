<!-- Base skeleton component with shimmer animation -->
<script lang="ts">
	interface Props {
		width?: string;
		height?: string;
		className?: string;
		rounded?: 'sm' | 'md' | 'lg' | 'full' | 'none';
	}

	let { width = '100%', height = '1rem', className = '', rounded = 'md' }: Props = $props();

	const roundedClasses = {
		none: '',
		sm: 'rounded-sm',
		md: 'rounded-md',
		lg: 'rounded-lg',
		full: 'rounded-full'
	};
</script>

<div
	class="skeleton-shimmer bg-gray-200 {roundedClasses[rounded]} {className}"
	style="width: {width}; height: {height};"
></div>

<style>
	.skeleton-shimmer {
		position: relative;
		overflow: hidden;
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
		animation: shimmer 2s infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}

	/* Subtle pulse animation as fallback */
	@media (prefers-reduced-motion: reduce) {
		.skeleton-shimmer {
			animation: pulse 2s infinite;
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.8;
		}
	}
</style>
