<!-- eslint-disable -->
<template>
	<!-- <svg version="1.1" :width="width" :height="height" viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			clip-rule="evenodd"
			d="M14 21C16.7614 21 19 18.7614 19 16C19 13.2386 16.7614 11 14 11C11.2386 11 9 13.2386 9 16C9 18.7614 11.2386 21 14 21ZM14 19C15.6569 19 17 17.6569 17 16C17 14.3431 15.6569 13 14 13C12.3431 13 11 14.3431 11 16C11 17.6569 12.3431 19 14 19Z"
			:fill="color"
			fill-rule="evenodd"
		/>
		<path
			clip-rule="evenodd"
			d="M20 7V3C20 2.44772 19.5523 2 19 2H9C8.44772 2 8 2.44772 8 3V7H3C1.89543 7 1 7.89543 1 9V24C1 25.1046 1.89543 26 3 26H25C26.1046 26 27 25.1046 27 24V9C27 7.89543 26.1046 7 25 7H20ZM10 7H18V4.8C18 4.35817 17.6418 4 17.2 4H10.8C10.3582 4 10 4.35817 10 4.8V7ZM25 9.8C25 9.35817 24.6418 9 24.2 9H3.8C3.35817 9 3 9.35817 3 9.8V23.2C3 23.6418 3.35817 24 3.8 24H24.2C24.6418 24 25 23.6418 25 23.2V9.8Z"
			:fill="color"
			fill-rule="evenodd"
		/>
	</svg> -->
	<svg
		version="1.1"
		:width="width"
		:height="height"
		v-on="$listeners"
		baseProfile="tiny"
		xmlns="http://www.w3.org/2000/svg"
		xmlns:xlink="http://www.w3.org/1999/xlink"
		x="0px"
		y="0px"
		viewBox="0 0 256 256"
		xml:space="preserve"
		:style="{ transform: `scale(${scale})` }"
	>
		<path
			:fill="color"
			d="M218.8,52.1H110.2v-0.9c0.1-0.5,0.1-1.1,0.1-1.6V38.2c0-7.8-6.4-14.2-14.2-14.2H85.9H33.4H23.3c-7.8,0-14.2,6.4-14.2,14.2
	v10.1v1.2V75v130.7c0,15.5,12.6,28,28.1,28.1h181.6c15.5,0,28.1-12.6,28.1-28.1V80.2C246.9,64.7,234.3,52.1,218.8,52.1z
	 M218.8,215.1H37.2c-5.2-0.1-9.3-4.2-9.4-9.4V80.3c0.1-5.2,4.2-9.3,9.4-9.4h181.6c5.2,0.1,9.3,4.2,9.4,9.4v125.4h0
	C228.1,210.9,224,215,218.8,215.1z M170.2,108.3c0-11.2,9.1-20.4,20.4-20.4s20.4,9.1,20.4,20.4c0,11.2-9.1,20.4-20.4,20.4h-0.1
	c0,0,0,0,0,0C179.2,128.7,170.2,119.5,170.2,108.3z M158.8,149.9l54.7,52.5h-173l51-103.7l33.8,75.3L158.8,149.9z"
		/>
	</svg>
</template>
<!-- eslint-disable -->

<script>
export default {
	props: {
		width: {
			type: String,
			default: "14px"
		},
		height: {
			type: String,
			default: "14px"
		},
		color: {
			type: String,
			default: "#333"
		},
		scale: {
			type: [String, Number],
			default: "1"
		}
	}
};
</script>
