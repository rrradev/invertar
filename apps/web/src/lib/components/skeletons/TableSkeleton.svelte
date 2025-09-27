<!-- Table skeleton component for users/admins pages -->
<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script lang="ts">
	import SkeletonBase from './SkeletonBase.svelte';

	interface Props {
		rows?: number;
		columns?: Array<{ width: string; label?: string }>;
		showActions?: boolean;
	}

	let {
		rows = 5,
		columns = [
			{ width: '30%', label: 'Name' },
			{ width: '25%', label: 'Created' },
			{ width: '25%', label: 'Status' },
			{ width: '20%', label: 'Actions' }
		],
		showActions = true
	}: Props = $props();
</script>

<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header skeleton -->
	<div class="mb-8">
		<SkeletonBase width="200px" height="2rem" className="mb-2" />
		<SkeletonBase width="300px" height="1rem" />
	</div>

	<!-- Table container -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
		<!-- Table header skeleton -->
		<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
			<div class="flex items-center justify-between">
				<div>
					<SkeletonBase width="120px" height="1.5rem" className="mb-1" />
					<SkeletonBase width="250px" height="0.875rem" />
				</div>
				{#if showActions}
					<SkeletonBase width="140px" height="2.5rem" rounded="md" />
				{/if}
			</div>
		</div>

		<!-- Table content -->
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<!-- Table header -->
				<thead class="bg-gray-50">
					<tr>
						{#each columns as _, colIndex (colIndex)}
							<th class="px-6 py-3 text-left">
								<SkeletonBase width="80px" height="0.875rem" />
							</th>
						{/each}
					</tr>
				</thead>

				<!-- Table rows skeleton -->
				<tbody class="bg-white divide-y divide-gray-200">
					{#each Array(rows) as _, rowIndex (rowIndex)}
						<tr class="hover:bg-gray-50">
							{#each columns as column, colIndex (colIndex)}
								<td class="px-6 py-4 whitespace-nowrap">
									{#if colIndex === columns.length - 1 && showActions}
										<!-- Actions column -->
										<div class="flex items-center space-x-2">
											<SkeletonBase width="24px" height="24px" rounded="sm" />
											<SkeletonBase width="24px" height="24px" rounded="sm" />
										</div>
									{:else if colIndex === 0}
										<!-- First column (usually name) - larger -->
										<div class="flex items-center">
											<SkeletonBase width="32px" height="32px" rounded="full" className="mr-3" />
											<div>
												<SkeletonBase width="120px" height="1rem" className="mb-1" />
												<SkeletonBase width="80px" height="0.75rem" />
											</div>
										</div>
									{:else if colIndex === 1}
										<!-- Second column (usually date) -->
										<SkeletonBase width="100px" height="0.875rem" />
									{:else}
										<!-- Other columns -->
										<SkeletonBase width={column.width} height="0.875rem" />
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</main>
