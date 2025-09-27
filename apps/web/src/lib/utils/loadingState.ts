/**
 * Enhanced loading state manager that prevents skeleton flashing and ensures minimum display time
 * 
 * Features:
 * - 120ms delay before showing skeleton (prevents flash for quick loads)
 * - 500ms minimum display time (ensures smooth UX when skeleton is shown)
 */

export interface LoadingStateOptions {
	/** Delay before showing skeleton (default: 120ms) */
	showDelay?: number;
	/** Minimum time to keep skeleton visible once shown (default: 500ms) */
	minDisplayTime?: number;
}

export interface LoadingController {
	/** Start loading with the configured delays */
	startLoading: () => void;
	/** End loading with minimum display time consideration */
	endLoading: () => void;
	/** Reset the loading state */
	reset: () => void;
}

/**
 * Creates an enhanced loading state controller that should be used with a $state variable
 * 
 * Usage in Svelte component:
 * ```svelte
 * let showSkeleton = $state(true);
 * const loadingController = createLoadingController(
 *   (value) => showSkeleton = value,
 *   { showDelay: 120, minDisplayTime: 500 }
 * );
 * ```
 */
export function createLoadingController(
	setShowSkeleton: (show: boolean) => void,
	options: LoadingStateOptions = {}
): LoadingController {
	const { showDelay = 120, minDisplayTime = 500 } = options;
	
	let showTimeout: ReturnType<typeof setTimeout> | null = null;
	let minDisplayTimeout: ReturnType<typeof setTimeout> | null = null;
	let skeletonShownAt: number | null = null;
	let isInitialLoad = true;

	function startLoading() {
		// Clear any existing timeouts
		if (showTimeout) {
			clearTimeout(showTimeout);
			showTimeout = null;
		}
		if (minDisplayTimeout) {
			clearTimeout(minDisplayTimeout);
			minDisplayTimeout = null;
		}

		// For initial load, show skeleton immediately
		if (isInitialLoad) {
			setShowSkeleton(true);
			skeletonShownAt = Date.now();
			return;
		}

		// For subsequent loads, delay showing skeleton
		setShowSkeleton(false);
		showTimeout = setTimeout(() => {
			setShowSkeleton(true);
			skeletonShownAt = Date.now();
			showTimeout = null;
		}, showDelay);
	}

	function endLoading() {
		isInitialLoad = false;

		// Clear show timeout if still pending
		if (showTimeout) {
			clearTimeout(showTimeout);
			showTimeout = null;
			// If skeleton was never shown, don't show it
			setShowSkeleton(false);
			return;
		}

		// If skeleton was not shown or we don't have a start time, hide immediately
		if (!skeletonShownAt) {
			setShowSkeleton(false);
			return;
		}

		// Calculate how long skeleton has been shown
		const displayTime = Date.now() - skeletonShownAt;
		const remainingTime = Math.max(0, minDisplayTime - displayTime);

		if (remainingTime > 0) {
			// Keep skeleton visible for remaining minimum time
			minDisplayTimeout = setTimeout(() => {
				setShowSkeleton(false);
				skeletonShownAt = null;
				minDisplayTimeout = null;
			}, remainingTime);
		} else {
			// Minimum time already elapsed, hide immediately
			setShowSkeleton(false);
			skeletonShownAt = null;
		}
	}

	function reset() {
		if (showTimeout) {
			clearTimeout(showTimeout);
			showTimeout = null;
		}
		if (minDisplayTimeout) {
			clearTimeout(minDisplayTimeout);
			minDisplayTimeout = null;
		}
		setShowSkeleton(false);
		skeletonShownAt = null;
		isInitialLoad = true;
	}

	return {
		startLoading,
		endLoading,
		reset
	};
}