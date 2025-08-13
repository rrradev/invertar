<script lang="ts">
  interface Admin {
    id: string;
    username: string;
    email: string;
    createdAt: string;
    hasInitialPassword: boolean;
  }

  let user = { role: 'SUPER_ADMIN', id: '1', organizationId: '1' };
  let admins: Admin[] = [
    {
      id: '1',
      username: 'admin1',
      email: 'admin1@example.com',
      createdAt: '2024-01-15T10:00:00Z',
      hasInitialPassword: false
    },
    {
      id: '2',
      username: 'admin2',
      email: 'admin2@example.com',
      createdAt: '2024-01-10T14:30:00Z',
      hasInitialPassword: true
    },
    {
      id: '3',
      username: 'admin3',
      email: 'admin3@example.com',
      createdAt: '2024-01-05T09:15:00Z',
      hasInitialPassword: false
    }
  ];
  
  let isLoading = false;
  let isCreating = false;
  let showCreateForm = false;
  let error = '';
  let successMessage = '';

  // Create admin form data
  let newAdmin = {
    username: '',
    email: '',
    organizationName: ''
  };

  async function createAdmin() {
    if (!newAdmin.username.trim() || !newAdmin.email.trim() || !newAdmin.organizationName.trim()) {
      error = 'All fields are required';
      return;
    }

    isCreating = true;
    error = '';
    successMessage = '';

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock successful creation
    const newId = (admins.length + 1).toString();
    const newAdminData = {
      id: newId,
      username: newAdmin.username,
      email: newAdmin.email,
      createdAt: new Date().toISOString(),
      hasInitialPassword: true
    };
    
    admins = [newAdminData, ...admins];
    successMessage = `Admin ${newAdmin.username} created successfully! Access code: ABC123XYZ`;
    newAdmin = { username: '', email: '', organizationName: '' };
    showCreateForm = false;
    isCreating = false;
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center space-x-4">
          <div class="h-8 w-8 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-lg flex items-center justify-center">
            <svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <h1 class="text-xl font-semibold text-gray-900">Invertar</h1>
        </div>
        
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-3">
            <span class="text-sm text-gray-700">Welcome, SUPER_ADMIN</span>
            <button class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Page Header -->
    <div class="mb-8">
      <div class="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Admin Management</h2>
          <p class="mt-2 text-sm text-gray-700">Manage administrators in your organization</p>
        </div>
        <div class="mt-4 sm:mt-0">
          <button
            on:click={() => showCreateForm = !showCreateForm}
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
          >
            <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Create Admin
          </button>
        </div>
      </div>
    </div>

    <!-- Messages -->
    {#if error}
      <div class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    {/if}

    {#if successMessage}
      <div class="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
        {successMessage}
      </div>
    {/if}

    <!-- Create Admin Form -->
    {#if showCreateForm}
      <div class="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Create New Admin</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              id="username"
              type="text"
              bind:value={newAdmin.username}
              placeholder="Enter username"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              disabled={isCreating}
            />
          </div>
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              id="email"
              type="email"
              bind:value={newAdmin.email}
              placeholder="Enter email"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              disabled={isCreating}
            />
          </div>
          <div>
            <label for="organization" class="block text-sm font-medium text-gray-700 mb-2">Organization</label>
            <input
              id="organization"
              type="text"
              bind:value={newAdmin.organizationName}
              placeholder="Enter organization name"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              disabled={isCreating}
            />
          </div>
        </div>
        <div class="mt-4 flex justify-end space-x-3">
          <button
            on:click={() => showCreateForm = false}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            on:click={createAdmin}
            disabled={isCreating}
            class="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {#if isCreating}
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            {:else}
              Create Admin
            {/if}
          </button>
        </div>
      </div>
    {/if}

    <!-- Admins List -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Administrators</h3>
        <p class="mt-1 text-sm text-gray-500">A list of all administrators in your organization</p>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Administrator
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each admins as admin (admin.id)}
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="h-10 w-10 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-full flex items-center justify-center">
                      <span class="text-sm font-medium text-white">{admin.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{admin.username}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{admin.email}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{formatDate(admin.createdAt)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {#if admin.hasInitialPassword}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending Setup
                    </span>
                  {:else}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </main>
</div>