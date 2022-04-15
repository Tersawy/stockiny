<template>
	<span class="status-badge" :style="{ color: status.color, borderColor: status.color }">{{ status.name }}</span>
</template>

<script>
	export default {
		props: {
			status: {
				type: Object,
				default: () => {}
			}
		}
	};
</script>

<style lang="scss">
	.status-badge {
		font-size: 75%;
		display: inline-block;
		line-height: 1;
		padding: 0.25rem 0.4rem;
		white-space: nowrap;
		vertical-align: baseline;
		border-radius: 0.25rem;
		border-width: 1px;
		border-style: solid;
		font-weight: 500;
		letter-spacing: 0.8px;
	}
</style>
