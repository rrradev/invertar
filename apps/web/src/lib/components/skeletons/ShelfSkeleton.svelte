<!-- Shelf skeleton component for dashboard -->
<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script lang="ts">
	import SkeletonBase from './SkeletonBase.svelte';

	interface Props {
		shelves?: number;
		itemsPerShelf?: number;
	}

	let { shelves = 3, itemsPerShelf = 4 }: Props = $props();
</script>

<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header skeleton -->
	<div class="mb-8">
		<SkeletonBase width="200px" height="2rem" className="mb-2" />
		<SkeletonBase width="350px" height="1rem" />
	</div>

	<!-- Action buttons skeleton -->
	<div class="mb-6 flex flex-wrap gap-3">
		<SkeletonBase width="140px" height="2.5rem" rounded="md" />
		<SkeletonBase width="120px" height="2.5rem" rounded="md" />
		<SkeletonBase width="130px" height="2.5rem" rounded="md" />
	</div>

	<!-- Shelves skeleton -->
	<div class="space-y-6">
		{#each Array(shelves) as _, shelfIndex (shelfIndex)}
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
				<!-- Shelf Header skeleton -->
				<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
					<div class="flex items-center justify-between">
						<div class="flex items-center">
							<!-- Shelf icon skeleton -->
							<SkeletonBase width="24px" height="24px" rounded="sm" className="mr-3" />
							<div>
								<SkeletonBase width="150px" height="1.25rem" className="mb-1" />
								<SkeletonBase width="100px" height="0.875rem" />
							</div>
						</div>
						<div class="flex items-center space-x-2">
							<SkeletonBase width="80px" height="0.875rem" />
							<SkeletonBase width="24px" height="24px" rounded="sm" />
						</div>
					</div>
				</div>

				<!-- Items table skeleton -->
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<!-- Table header skeleton -->
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3">
									<SkeletonBase width="60px" height="0.875rem" />
								</th>
								<th class="px-6 py-3">
									<SkeletonBase width="80px" height="0.875rem" />
								</th>
								<th class="px-6 py-3">
									<SkeletonBase width="60px" height="0.875rem" />
								</th>
								<th class="px-6 py-3">
									<SkeletonBase width="70px" height="0.875rem" />
								</th>
								<th class="px-6 py-3">
									<SkeletonBase width="60px" height="0.875rem" />
								</th>
								<th class="px-6 py-3">
									<SkeletonBase width="50px" height="0.875rem" />
								</th>
								<th class="px-6 py-3">
									<SkeletonBase width="70px" height="0.875rem" />
								</th>
							</tr>
						</thead>

						<!-- Table rows skeleton -->
						<tbody class="bg-white divide-y divide-gray-200">
							{#each Array(itemsPerShelf) as _, itemIndex (itemIndex)}
								<tr class="hover:bg-gray-50">
									<!-- Item name -->
									<td class="px-6 py-4">
										<div class="flex items-center">
											<SkeletonBase width="40px" height="40px" rounded="md" className="mr-3" />
											<div>
												<SkeletonBase width="120px" height="1rem" className="mb-1" />
												<SkeletonBase width="200px" height="0.75rem" />
											</div>
										</div>
									</td>
									<!-- Labels -->
									<td class="px-6 py-4">
										<div class="flex space-x-2">
											<SkeletonBase width="60px" height="1.5rem" rounded="full" />
											<SkeletonBase width="50px" height="1.5rem" rounded="full" />
										</div>
									</td>
									<!-- Price -->
									<td class="px-6 py-4">
										<SkeletonBase width="60px" height="1rem" />
									</td>
									<!-- Cost -->
									<td class="px-6 py-4">
										<SkeletonBase width="60px" height="1rem" />
									</td>
									<!-- Quantity -->
									<td class="px-6 py-4">
										<SkeletonBase width="40px" height="1rem" />
									</td>
									<!-- Unit -->
									<td class="px-6 py-4">
										<SkeletonBase width="30px" height="1rem" />
									</td>
									<!-- Actions -->
									<td class="px-6 py-4">
										<div class="flex items-center space-x-2">
											<SkeletonBase width="24px" height="24px" rounded="sm" />
											<SkeletonBase width="24px" height="24px" rounded="sm" />
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Empty state for shelf with no items -->
				{#if itemsPerShelf === 0}
					<div class="px-6 py-8 text-center">
						<SkeletonBase width="32px" height="32px" rounded="md" className="mx-auto mb-2" />
						<SkeletonBase width="150px" height="0.875rem" className="mx-auto" />
					</div>
				{/if}
			</div>
		{/each}

		<!-- Empty state when no shelves -->
		{#if shelves === 0}
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
				<SkeletonBase width="48px" height="48px" rounded="md" className="mx-auto mb-4" />
				<SkeletonBase width="200px" height="1.25rem" className="mx-auto mb-2" />
				<SkeletonBase width="300px" height="0.875rem" className="mx-auto mb-4" />
				<SkeletonBase width="120px" height="2.5rem" rounded="md" className="mx-auto" />
			</div>
		{/if}
	</div>
</main>
