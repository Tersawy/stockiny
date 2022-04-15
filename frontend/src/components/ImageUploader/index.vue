<template>
	<div
		:class="`image-uploader slider-${sliderPosition}`"
		@drag="preventEvent"
		@dragstart="preventEvent"
		@dragend="preventEvent"
		@dragover="preventEvent"
		@dragenter="preventEvent"
		@dragleave="preventEvent"
		@drop="preventEvent"
	>
		<div class="upload-area" :class="{ active: isDragover }">
			<label class="dragable-area" :for="inputId" @drop="onDrop" @dragover.prevent="onDragover" @dragleave="onDragleave"> </label>

			<div class="placeholder" @dragover.prevent="onDragover" @dragleave="onDragleave">
				<template v-if="isDragover">
					<IconImage class="placeholder-image-drag" />
					<div class="placeholder-text drop">Drop your images here.</div>
				</template>

				<template v-else>
					<template v-if="!files.length">
						<IconDrag class="placeholder-icon-drag" />
						<div class="placeholder-text">Drag and drop your images here or click to select images to upload.</div>
					</template>

					<template v-else>
						<image-review :no-review="noReview || disabled" :imageReview="imageReview">
							<template #images-list>
								<image-list :inputId="inputId" direction="row">
									<template #image-item>
										<image-item
											v-for="(file, i) in files"
											:key="i"
											:image="file"
											:disabled="disabled"
											:active="isActive(file)"
											@delete-image="deleteImage"
											@click="setActive"
										/>
									</template>
								</image-list>
							</template>
						</image-review>
					</template>
				</template>
			</div>
		</div>

		<image-list v-if="files.length" :disabledAddBtn="disabled" :inputId="inputId" class="btn-darker" :direction="sliderDirection">
			<template #image-item v-if="!noSlider">
				<image-item v-for="(file, i) in files" :key="i" :image="file" :disabled="disabled" :active="isActive(file)" @delete-image="deleteImage" @click="setActive" />
			</template>
		</image-list>

		<input :accept="accept" :disabled="disabled" type="file" :id="inputId" :ref="inputId" hidden style="display: none" multiple @change="uploadImages" />
	</div>
</template>

<script>
	import ImageItem from "./ImageItem.vue";

	import IconDrag from "./icons/IconDrag.vue";

	import IconImage from "./icons/IconImage.vue";

	import ImageList from "./ImageList.vue";

	import ImageReview from "./ImageReview.vue";

	export default {
		name: "ImageUploader",

		components: { IconDrag, IconImage, ImageList, ImageReview, ImageItem },

		props: {
			inputId: { type: String, default: "image-uploader-input" },

			max: { type: Number, default: 5 },

			disabled: { type: Boolean, default: false },

			paste: { type: Boolean, default: true },

			noReview: { type: Boolean, default: false },

			noSlider: { type: Boolean, default: false },

			maxSize: { type: Number, default: 5 },

			accept: { type: String, default: ".png, .jpg, .jpeg" },

			beforeUpload: { type: Function, default: () => {} },

			sliderPosition: {
				type: String,
				default: "right",
				validator: (value) => ["top", "bottom", "right", "left"].includes(value)
			},

			sliderDirection: {
				type: String,
				default: "column",
				validator: (value) => ["row", "column"].includes(value)
			}
		},

		data: () => ({
			files: [],
			isDragover: false,
			activeFile: null
		}),

		computed: {
			imageReview() {
				return (this.activeFile && URL.createObjectURL(this.activeFile)) || "";
			}
		},

		methods: {
			setActive(file) {
				let files = [...this.files];

				let index = files.indexOf(file);

				if (index !== -1) {
					let splice = files.splice(index, 1);

					files.unshift(...splice);
				}

				this.$emit("input", files);

				this.activeFile = file;
			},

			preventEvent(e) {
				e.preventDefault();
				e.stopPropagation();
			},

			onDragover() {
				this.isDragover = true;
			},

			onDragleave() {
				this.isDragover = false;
			},

			onDrop(e) {
				this.isDragover = false;
				e.stopPropagation();
				e.preventDefault();

				this.$refs[this.inputId].files = e.dataTransfer.files;

				this.uploadImages();
			},

			async uploadImages() {
				let files = this.$refs[this.inputId].files;

				if (this.disabled || !files || !files.length) return;

				if (!this.isMaxLength()) return;

				for (let i = 0; i < files.length; i++) {
					let file = files[i];

					if (!this.files.length) {
						this.activeFile = file;
					}

					await this.uploadImage(file);

					if (this.files.length >= this.max) break;
				}
			},

			async uploadImage(file) {
				if (!file) return;

				if (!this.isValid(file)) return;

				let prevented = false;

				let prevent = () => (prevented = true);

				await this.beforeUpload(null, file, prevent);

				if (prevented) return;

				this.files = [...this.files, file];

				this.$emit("input", this.files);
			},

			deleteImage(file) {
				this.files = this.files.filter((f) => f !== file);

				this.$emit("input", this.files);

				if (this.isActive(file)) {
					if (this.files.length) {
						this.setActive(this.files[0]);
					} else {
						this.activeFile = null;
					}
				}
			},

			onPaste(e) {
				this.$refs[this.inputId].files = e.clipboardData.files;

				this.uploadImages();
			},

			$reset() {
				this.files = [];

				this.$emit("input", []);
			},

			isMaxLength() {
				if (this.files.length == this.max) {
					this.beforeUpload({ type: "maxValue", max: this.max });

					return false;
				}

				return true;
			},

			isValidSize({ size }) {
				if (this.maxSize * 1024 * 1024 < size) {
					this.beforeUpload({ type: "maxValue", max: `${this.maxSize} MB` });

					return false;
				}

				return true;
			},

			isValidType({ type }) {
				let extensions = this.accept.match(/(\w+)/g);

				let extension = type.split("/")[1];

				if (!extensions.includes(extension)) {
					this.beforeUpload({ type: "enum", value: extensions.join(", ") });

					return false;
				}

				return true;
			},

			isExists({ name, size }) {
				let image = this.files.find((file) => file.name === name && file.size === size);

				if (image) {
					this.beforeUpload({ type: "exists" });

					return false;
				}

				return true;
			},

			isValid(file) {
				if (!this.isValidSize(file)) return false;
				if (!this.isValidType(file)) return false;
				if (!this.isExists(file)) return false;

				return true;
			},

			isActive(file) {
				return this.activeFile && this.activeFile === file;
			}
		},

		created() {
			if (this.paste) {
				window.addEventListener("paste", this.onPaste);
			}
		},

		beforeDestroy() {
			if (this.paste) {
				window.removeEventListener("paste", this.onPaste);
			}
		}
	};
</script>

<style lang="scss" scoped>
	.image-uploader {
		width: 100%;
		height: 300px;
		display: flex;
		&.slider-bottom,
		&.slider-top {
			justify-content: flex-start;
			align-items: center;
			height: 500px;
		}
		&.slider-bottom {
			flex-direction: column;
			.image-list {
				margin-top: 10px;
			}
		}
		&.slider-top {
			flex-direction: column-reverse;
			.image-list {
				margin-bottom: 10px;
			}
		}
		&.slider-right {
			flex-direction: row;
			.image-list {
				margin-left: 10px;
			}
		}
		&.slider-left {
			flex-direction: row-reverse;
			.image-list {
				margin-right: 10px;
			}
		}
		.btn-add-new {
			padding: 10px 25px;
			&:hover {
				border-color: rgb(255, 0, 0);
			}
			&:hover::before,
			&:hover::after {
				background-color: rgb(87, 0, 0);
			}
		}
		.upload-area {
			border: 1px dashed #ccc;
			border-radius: 8px;
			height: 100%;
			width: 100%;
			display: flex;
			justify-content: center;
			align-items: center;
			position: relative;
			overflow: hidden;
			.dragable-area {
				position: absolute;
				cursor: pointer;
				width: 100%;
				height: 100%;
				left: 0;
				background-color: transparent;
			}
			.placeholder {
				display: flex;
				justify-content: center;
				align-items: center;
				flex-direction: column;
				width: 100%;
				height: 100%;
				text-align: center;
				.placeholder-icon-drag,
				.placeholder-image-drag {
					fill: #ccc;
					height: 150px;
				}
				.placeholder-text {
					color: rgb(136, 136, 136);
					font-size: 14px;
					margin-top: 50px;
					&.drop {
						color: #007bff;
					}
				}
			}
			&.active {
				border-width: 0;
				.placeholder-image-drag {
					fill: #007bff;
				}
				// pulled from https://stackoverflow.com/a/57382510
				background: linear-gradient(90deg, #007bff 50%, transparent 50%), linear-gradient(90deg, #007bff 50%, transparent 50%),
					linear-gradient(0deg, #007bff 50%, transparent 50%), linear-gradient(0deg, #007bff 50%, transparent 50%);
				background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
				background-size: 15px 4px, 15px 4px, 4px 15px, 4px 15px;
				animation: border-dance 6s infinite linear;
				@keyframes border-dance {
					0% {
						background-position: 0 0, 100% 100%, 0 100%, 100% 0;
					}
					100% {
						background-position: 100% 0, 0 100%, 0 0, 100% 100%;
					}
				}
			}
		}
	}
</style>
