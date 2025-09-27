<!-- Skeleton component specifically for shelf items table -->
<script lang="ts">
	import SkeletonBase from './SkeletonBase.svelte';

	interface Props {
		rows?: number;
	}

	let { rows = 3 }: Props = $props();

</script>

<div class="overflow-x-auto">
	<table class="min-w-full divide-y divide-gray-200">
		<thead class="bg-gray-50">
			<tr>
				<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
					Item
				</th>
				<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
					Labels
				</th>
				<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
					Description
				</th>
				<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
					Cost
				</th>
				<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
					Price
				</th>
				<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
					Quantity
				</th>
				<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
					Unit
				</th>
				<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
					Total Value
				</th>
				<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
					Last Modified
				</th>
				<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
					Actions
				</th>
			</tr>
		</thead>
		<tbody class="bg-white divide-y divide-gray-200">
			{#each Array(rows) as _, rowIndex (rowIndex)}
				<tr class="hover:bg-gray-50">
					<!-- Item column -->
					<td class="px-6 py-4 whitespace-nowrap">
						<div class="flex items-center">
							<div class="h-8 w-8 bg-gray-300 rounded-lg mr-3 animate-pulse"></div>
							<SkeletonBase width="120px" height="1rem" />
						</div>
					</td>
					<!-- Labels column -->
					<td class="px-6 py-4 whitespace-nowrap">
						<div class="flex space-x-1">
							<SkeletonBase width="60px" height="24px" rounded="full" />
							<SkeletonBase width="50px" height="24px" rounded="full" />
						</div>
					</td>
					<!-- Description column -->
					<td class="px-6 py-4 whitespace-nowrap">
						<SkeletonBase width="150px" height="0.875rem" />
					</td>
					<!-- Cost column -->
					<td class="px-6 py-4 whitespace-nowrap">
						<SkeletonBase width="60px" height="0.875rem" />
					</td>
					<!-- Price column -->
					<td class="px-6 py-4 whitespace-nowrap">
						<SkeletonBase width="60px" height="0.875rem" />
					</td>
					<!-- Quantity column -->
					<td class="px-6 py-4 whitespace-nowrap">
						<SkeletonBase width="40px" height="0.875rem" />
					</td>
					<!-- Unit column -->
					<td class="px-6 py-4 whitespace-nowrap">
						<SkeletonBase width="30px" height="0.875rem" />
					</td>
					<!-- Total Value column -->
					<td class="px-6 py-4 whitespace-nowrap">
						<SkeletonBase width="80px" height="0.875rem" />
					</td>
					<!-- Last Modified column -->
					<td class="px-6 py-4 whitespace-nowrap">
						<SkeletonBase width="100px" height="0.875rem" />
					</td>
					<!-- Actions column -->
					<td class="px-6 py-4 whitespace-nowrap">
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