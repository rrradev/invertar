<!-- Skeleton demo layout - bypasses auth -->
<script lang="ts">
	import '../../app.css';

	interface LayoutProps {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		children: any;
	}

	let { children }: LayoutProps = $props();
</script>

{@render children()}