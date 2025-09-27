<!-- Demo page to showcase skeleton loading components -->
<script lang="ts">
	import ShelfSkeleton from '$lib/components/skeletons/ShelfSkeleton.svelte';
	import TableSkeleton from '$lib/components/skeletons/TableSkeleton.svelte';

	let currentDemo = $state<'dashboard' | 'users' | 'admins'>('dashboard');
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Simple header without auth -->
	<div class="bg-white shadow-sm border-b border-gray-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-6">
				<div class="flex items-center">
					<div class="bg-indigo-600 rounded-lg p-2 mr-3">
						<svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
							/>
						</svg>
					</div>
					<h1 class="text-2xl font-bold text-gray-900">Invertar</h1>
				</div>
			</div>
		</div>
	</div>

	<!-- Demo Controls -->
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Skeleton Loading Demo</h2>
			<div class="flex space-x-4">
				<button
					onclick={() => (currentDemo = 'dashboard')}
					class="px-4 py-2 rounded-md text-sm font-medium {currentDemo === 'dashboard'
						? 'bg-indigo-600 text-white'
						: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
				>
					Dashboard Skeleton
				</button>
				<button
					onclick={() => (currentDemo = 'users')}
					class="px-4 py-2 rounded-md text-sm font-medium {currentDemo === 'users'
						? 'bg-indigo-600 text-white'
						: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
				>
					Users Table Skeleton
				</button>
				<button
					onclick={() => (currentDemo = 'admins')}
					class="px-4 py-2 rounded-md text-sm font-medium {currentDemo === 'admins'
						? 'bg-indigo-600 text-white'
						: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
				>
					Admins Table Skeleton
				</button>
			</div>
		</div>
	</div>

	<!-- Skeleton Demos -->
	{#if currentDemo === 'dashboard'}
		<ShelfSkeleton shelves={3} itemsPerShelf={4} />
	{:else if currentDemo === 'users'}
		<TableSkeleton
			title="Users"
			subtitle="Manage users in your organization"
			rows={5}
			columns={[
				{ width: '40%', label: 'User' },
				{ width: '25%', label: 'Created' },
				{ width: '20%', label: 'Status' },
				{ width: '15%', label: 'Actions' }
			]}
			showActions={true}
		/>
	{:else if currentDemo === 'admins'}
		<TableSkeleton
			title="Admins"
			subtitle="Manage administrators across organizations"
			rows={5}
			columns={[
				{ width: '35%', label: 'Admin' },
				{ width: '25%', label: 'Organization' },
				{ width: '20%', label: 'Created' },
				{ width: '20%', label: 'Actions' }
			]}
			showActions={true}
		/>
	{/if}
</div>