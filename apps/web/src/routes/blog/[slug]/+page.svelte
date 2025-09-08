<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>{data.post.title}</h1>
<div>{@html data.post.content}</div>
{#if data.post.admin}
    <h2>Admin Info</h2>
    <p>Name: {data.post.admin.username}</p>
    <p>Org: {data.post.admin.organizationName}</p>
{/if}