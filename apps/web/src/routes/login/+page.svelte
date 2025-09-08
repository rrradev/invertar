<script lang="ts">
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/user';
	import { trpc } from '$lib/trpc';
	import { SuccessStatus } from '@repo/types/trpc/successStatus';

	let username = '';
	let organizationName = '';
	let password = '';
	let isLoading = false;
	let error = '';



	async function handleLogin() {
		if (!username.trim() || !organizationName.trim() || !password.trim()) {
			error = 'All fields are required';
			return;
		}

		isLoading = true;
		error = '';

		try {
			const result = await trpc.auth.login.mutate({ username, organizationName, password });

			if (result.status === SuccessStatus.SUCCESS) {
				// Get user profile and set user store after successful login
				const profileResult = await trpc.auth.profile.query();
				user.set({
					username: profileResult.username,
					organizationName: profileResult.organizationName,
					role: profileResult.role
				});
				goto('/dashboard');
			} else if (result.status === SuccessStatus.VALID_ACCESS_CODE) {
				goto(`/set-password?userId=${result.userId}&code=${password}`);
			}
		} catch (err: any) {
			error = err.message || 'Login failed. Please check your credentials.';
		} finally {
			isLoading = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleLogin();
		}
	}
</script>

<div
	class="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-cyan-100 flex items-center justify-center p-4"
>
	<div class="max-w-md w-full space-y-8">
		<div class="text-center">
			<div
				class="mx-auto h-16 w-16 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-full flex items-center justify-center mb-6"
			>
				<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
					/>
				</svg>
			</div>
			<h2 class="text-4xl font-bold text-gray-900 mb-2">Invertar</h2>
			<p class="text-gray-600">Sign in to your account</p>
		</div>

		<div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
			<form on:submit|preventDefault={handleLogin} class="space-y-6">
				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
						{error}
					</div>
				{/if}

				<div>
					<label for="organizationName" class="block text-sm font-medium text-gray-700 mb-2">
						Organization Name
					</label>
					<input
						id="organizationName"
						type="text"
						bind:value={organizationName}
						on:keypress={handleKeyPress}
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white/50 backdrop-blur-sm"
						placeholder="Enter your organization name"
						disabled={isLoading}
					/>
				</div>

				<div>
					<label for="username" class="block text-sm font-medium text-gray-700 mb-2">
						Username
					</label>
					<input
						id="username"
						type="text"
						bind:value={username}
						on:keypress={handleKeyPress}
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white/50 backdrop-blur-sm"
						placeholder="Enter your username"
						disabled={isLoading}
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
						Password
					</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						on:keypress={handleKeyPress}
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white/50 backdrop-blur-sm"
						placeholder="Enter your password"
						disabled={isLoading}
					/>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
				>
					{#if isLoading}
						<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
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
						Signing in...
					{:else}
						Sign in
					{/if}
				</button>
			</form>

			<div class="mt-6 text-center">
				<p class="text-sm text-gray-600">Forgot your password? Contact your administrator</p>
			</div>
		</div>
	</div>
</div>
