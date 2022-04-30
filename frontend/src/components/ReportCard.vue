<template>
	<div class="t-card shadow-sm rounded-lg">
		<div class="t-card-content">
			<div class="t-card-numbers">
				<slot name="number">{{ number }}</slot>
			</div>
			<div class="t-card-name">
				<slot name="name">{{ name }}</slot>
			</div>
		</div>
		<div class="t-card-icon">
			<slot name="icon">
				<span v-if="awesome || awesome == ''">
					<i :class="icon"></i>
				</span>
				<b-icon v-else :icon="icon"></b-icon>
			</slot>
		</div>
	</div>
</template>

<script>
	export default {
		props: ["name", "number", "icon", "awesome"]
	};
</script>

<style scoped lang="scss">
	.t-card {
		position: relative;
		background: #fff;
		padding: 20px;
		display: flex;
		justify-content: space-between;
		cursor: pointer;
		.t-card-content {
			.t-card-numbers {
				position: relative;
				font-size: 2em;
				font-weight: 500;
			}
			.t-card-name {
				color: #999;
			}
		}
		.t-card-icon {
			font-size: 2.5em;
			color: var(--primary);
		}
	}
</style>
