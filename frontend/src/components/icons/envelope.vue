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
	>
		<g>
			<path
				d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2zm13 2.383-4.758 2.855L15 11.114v-5.73zm-.034 6.878L9.271 8.82 8 9.583 6.728 8.82l-5.694 3.44A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.739zM1 11.114l4.758-2.876L1 5.383v5.73z"
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
		}
	}
};
</script>
