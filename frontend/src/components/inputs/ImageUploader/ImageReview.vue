<template>
	<div class="image-review">
		<div class="image-wrapper" :style="{ cursor: noReview ? '' : 'pointer' }">
			<img :src="imageReview" />
		</div>
		<template v-if="!noReview">
			<div class="icon-focusable" @click="sliderIsOpen = true">
				<IconSearchPlus class="icon" />
			</div>
			<slider-images @close="sliderIsOpen = false" :show="sliderIsOpen" :imageReview="imageReview">
				<template #images-list>
					<slot name="images-list" />
				</template>
			</slider-images>
		</template>
	</div>
</template>

<script>
	import IconSearchPlus from "./icons/IconSearchPlus";

	import SliderImages from "./SliderImages";

	export default {
		components: { IconSearchPlus, SliderImages },

		props: {
			imageReview: { type: String, required: true },

			noReview: { type: Boolean, default: false }
		},

		data: () => ({
			sliderIsOpen: false
		})
	};
</script>

<style lang="scss" scoped>
	.image-review {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		.image-wrapper {
			width: 100%;
			height: 100%;
			border-radius: 10px;
			overflow: hidden;
			position: relative;
			padding: 10px;
			img {
				width: 100%;
				height: 100%;
				object-fit: contain;
			}
		}
		.icon-focusable {
			position: absolute;
			width: calc(100% - 20px);
			height: calc(100% - 20px);
			top: 10px;
			left: 10px;
			background-color: rgba(0, 0, 0, 0.5);
			border-radius: 8px;
			transition: opacity 0.3s ease-in-out;
			display: flex;
			justify-content: center;
			align-items: center;
			opacity: 0;
			cursor: pointer;
			.icon {
				color: #fff;
				font-size: 12px;
				position: absolute;
				width: 50px;
				height: 50px;
			}
			&:hover {
				opacity: 1;
			}
		}
	}
</style>
