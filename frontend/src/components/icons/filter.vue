<!-- eslint-disable -->
<template>
	<svg
		:width="width"
		:height="height"
		:stroke="color"
		:color="color"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		fill="none"
	>
		<path d="M10 12.261L4.028 3.972h16L14 12.329V17l-4 3z" />
	</svg>
</template>
<!-- eslint-disable -->

<script>
	export default {
		props: {
			width: {
				type: String,
				default: "1.2em"
			},
			height: {
				type: String,
				default: "1.2em"
			},
			color: {
				type: String,
				default: "#fff"
			}
		}
	};
</script>
