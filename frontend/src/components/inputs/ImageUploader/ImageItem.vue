<template>
	<div class="image-item" :class="{ active }" @click="imageClick" ref="imageItem">
		<div class="image-wrapper" @click="imageClick">
			<img :src="getURL(image)" />
		</div>
		<div class="icon-delete" v-if="!disabled" @click="$emit('delete-image', image)">
			<IconTrash />
		</div>
	</div>
</template>

<script>
	import IconTrash from "./icons/IconTrash.vue";

	export default {
		components: { IconTrash },

		props: {
			image: { type: File, required: true },

			active: { type: Boolean, default: false },

			disabled: { type: Boolean, default: false }
		},

		watch: {
			active: function (newValue) {
				if (newValue) {
					this.scrollToImage();
				}
			}
		},

		mounted() {
			this.scrollToImage();
		},

		methods: {
			imageClick() {
				this.$emit("click", this.image);
				this.scrollToImage();
			},
			scrollToImage() {
				let imageItem = this.$refs.imageItem;

				if (this.active && imageItem) {
					let isRow = this.$refs.imageItem.parentElement.classList.contains("direction-row");

					let imageListOffset = imageItem.parentElement[`client${isRow ? "Width" : "Height"}`];

					let imageSize = imageItem[`client${isRow ? "Width" : "Height"}`];

					let position = imageItem[`offset${isRow ? "Left" : "Top"}`] - imageSize / 2 - imageListOffset / 2;

					if (isRow) {
						imageItem.parentElement.scrollLeft = position + imageSize;
					} else {
						imageItem.parentElement.scrollTop = position;
					}
				}
			},

			getURL(image) {
				return URL.createObjectURL(image);
			}
		}
	};
</script>

<style lang="scss" scoped>
	.image-item {
		width: 60px;
		height: 60px;
		display: flex;
		justify-content: center;
		align-items: center;
		border: 1px solid #ccc;
		border-radius: 5px;
		margin: 0 auto 8px;
		cursor: pointer;
		position: relative;
		&:hover {
			transform: scale(1.05);
		}
		&.active {
			border-color: #007bff;
		}
		.image-wrapper {
			width: 50px;
			height: 50px;
			border-radius: 5px;
			overflow: hidden;
			img {
				width: 100%;
				height: 100%;
			}
		}
		.icon-delete {
			position: absolute;
			bottom: 5px;
			left: 5px;
			cursor: pointer;
			background-color: #dc3545;
			padding: 0 2px;
			border-radius: 4px;
			display: none;
			svg {
				width: 12px;
				height: 12px;
				fill: #fff;
			}
		}
		&:hover {
			.icon-delete {
				display: block;
			}
		}
	}
</style>
