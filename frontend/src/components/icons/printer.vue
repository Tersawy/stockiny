<!-- eslint-disable -->
<template>
	<svg
		viewBox="0 0 16 16"
		:width="width"
		:height="height"
		:fill="color"
		v-on="$listeners"
		xmlns="http://www.w3.org/2000/svg"
		style="display: inline-block; overflow: visible; vertical-align: -0.15rem; outline: none; cursor: pointer"
		:style="{ transform: `scale(${scale})` }"
	>
		<g>
			<path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"></path>
			<path
				d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"
			></path>
		</g>
	</svg>
</template>
<!-- eslint-disable -->

<script>
export default {
	props: {
		width: {
			type: String,
			default: "20px"
		},
		height: {
			type: String,
			default: "20px"
		},
		color: {
			type: String,
			default: "currentColor"
		},

		scale: { type: [Number, String], default: 1 }
	}
};
</script>
