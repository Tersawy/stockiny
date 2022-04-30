<template>
	<div class="slider-images" v-if="show">
		<div class="slider-backdrop" @click="close"></div>
		<span class="btn-close" @click="close">&times;</span>
		<div class="slider-body">
			<div class="slider-image-container">
				<img :src="imageReview" />
			</div>
			<div class="slider-images-thumbnails">
				<slot name="images-list" />
			</div>
		</div>
	</div>
</template>

<script>
	// import ImageList from "./ImageList.vue";
	export default {
		// components: { ImageList },
		props: {
			show: { type: Boolean, default: false },

			imageReview: { type: String, required: true }
		},

		watch: {
			show(newVal) {
				if (newVal) {
					document.body.style.overflow = "hidden";
				} else {
					document.body.style.overflow = "auto";
				}
			}
		},

		methods: {
			close() {
				this.$emit("close");
			}
		}
	};
</script>

<style lang="scss" scoped>
	.slider-images {
		width: 100vw;
		height: 100vh;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		position: fixed;
		top: 0;
		left: 0;
		z-index: 9999;
		.slider-body {
			width: 90%;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			z-index: 9999;
			.slider-image-container {
				width: 100%;
				img {
					max-width: 100%;
					max-height: 80vh;
					object-fit: contain;
				}
			}
			.slider-images-thumbnails {
				position: relative;
				width: 90%;
				display: flex;
				justify-content: center;
			}
			@media (min-width: 1200px) {
				width: 60%;
			}
		}
		.slider-backdrop {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-color: rgba($color: #000000, $alpha: 0.5);
		}
		.btn-close {
			position: absolute;
			top: 30px;
			right: 30px;
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			font-size: 50px;
			color: #ccc;
			width: 0px;
			height: 0px;
			&:hover {
				color: #fff;
			}
		}
	}
</style>
