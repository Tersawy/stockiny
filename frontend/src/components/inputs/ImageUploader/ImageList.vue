<template>
	<div :class="`image-list direction-${direction}`" ref="imageList">
		<label class="btn-add-new" :for="inputId" :class="{ disabled: disabledAddBtn }"></label>
		<slot name="image-item" />
	</div>
</template>

<script>
	export default {
		props: {
			inputId: { type: String, default: "image-uploader-input" },

			disabledAddBtn: { type: Boolean, default: false },

			direction: {
				type: String,
				default: "column",
				validator: (value) => ["row", "column"].includes(value)
			}
		}
	};
</script>

<style lang="scss" scoped>
	.image-list {
		width: 117px;
		height: 100%;
		padding: 10px;
		overflow-y: auto;
		.btn-add-new {
			width: 60px;
			height: 60px;
			border: 1px solid #ccc;
			border-radius: 5px;
			margin: 0 auto 8px;
			position: relative;
			cursor: pointer;
			transition: 0.2s;
			display: flex;
			justify-content: center;
			align-items: center;
			&::before,
			&::after {
				content: "";
				position: absolute;
				background-color: #ccc;
				transition: 0.2s;
			}
			&::before {
				height: 3px;
				width: 16px;
			}
			&::after {
				width: 3px;
				height: 16px;
			}
			&:not(.disabled):hover {
				border-color: #555555;
			}
			&:not(.disabled):hover::before,
			&:not(.disabled):hover::after {
				background-color: #555555;
			}
			&.disabled {
				cursor: not-allowed;
			}
		}
		&.direction-row {
			display: flex;
			flex-direction: row;
			align-items: center;
			justify-content: flex-start;
			width: min-content;
			height: 135px;
			overflow-y: auto;
			overflow-x: auto;
			max-width: 100%;
			margin: 10px 0;
			.image-item,
			.btn-add-new {
				margin: 0 5px;
			}
			.image-item {
				margin: 0 5px;
				padding: 5px;
			}
			.btn-add-new {
				padding: 10px 25px;
			}
			&:not(.btn-darker) {
				.btn-add-new {
					padding: 10px 25px;
					&:hover {
						border-color: #fff;
					}
					&:hover::before,
					&:hover::after {
						background-color: #fff;
					}
				}
			}
		}
	}
</style>
