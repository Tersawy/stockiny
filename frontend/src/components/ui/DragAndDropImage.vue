<template>
	<div
		class="default-drag-drop-inputfile"
		:class="{ active: isDragover }"
		@drag="preventEvent"
		@dragstart="preventEvent"
		@dragend="preventEvent"
		@dragover="preventEvent"
		@dragenter="preventEvent"
		@dragleave="preventEvent"
		@drop="preventEvent"
	>
		<label v-if="!imageSrc" :for="id" @drop="onDrop" @dragover.prevent="onDragover" @dragleave.prevent="onDragleave">
			<template v-if="isDragover">Drop image here.</template>
			<template v-else>Drag and drop image here or click to select image to upload.</template>
		</label>
		<div class="image-preview" v-if="imageSrc">
			<div class="image-wrapper">
				<span class="img-overlay">
					<span class="times-delete-image" @click="removeImage">&times;</span>
				</span>
				<img :src="imageSrc" />
			</div>
		</div>
		<input :ref="id" :id="id" type="file" hidden style="display: none" :accept="accept" @input="uploadImage" :disabled="disabled" />
	</div>
</template>

<script>
	export default {
		props: {
			type: { type: String, default: "text" },
			label: { type: String, default: "" },
			id: { type: String, default: "default-drag-fileinput" },
			disabled: { type: Boolean, default: false },
			accept: { type: String, default: ".png, .jpg, .jpeg" },
			fileSize: { type: Number, default: 5 },
			image: { type: [String, File], default: "" },
			beforeUpload: { type: Function, default: () => {} }
		},

		data() {
			return {
				isDragover: false
			};
		},

		computed: {
			imageSrc() {
				if (!this.image) return "";

				if (typeof this.image === "string") {
					return this.image;
				} else {
					return URL.createObjectURL(this.image);
				}
			}
		},

		methods: {
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
				this.preventEvent(e);

				if (this.disabled) return;

				this.isDragover = false;

				this.$refs[this.id].files = e.dataTransfer.files;

				this.uploadImage();
			},

			async uploadImage() {
				let files = this.$refs[this.id].files;

				let file = files[0];

				if (!file) return;

				let extensions = this.accept.match(/(\w+)/g);

				let mime = file.type;

				let extension = mime.split("/")[1];

				if (!extensions.includes(extension)) {
					this.$refs[this.id].files = null;

					return this.beforeUpload({ type: "enum", value: extensions.join(", ") });
				}

				if (this.fileSize * 1024 * 1024 < file.size) {
					this.$refs[this.id].files = null;

					return this.beforeUpload({ type: "maxValue", max: `${this.fileSize} MB` });
				}

				let prevented = false;

				let prevent = () => {
					prevented = true;
				};

				await this.beforeUpload(null, file, prevent);

				if (prevented) return;

				this.$emit("input", file);
			},

			removeImage() {
				this.$emit("input", null);
			}
		}
	};
</script>

<style lang="scss">
	.default-drag-drop-inputfile {
		width: 100%;
		min-height: 180px;
		max-height: 230px;
		display: inline-block;
		margin: 0 auto;
		label,
		.image-preview {
			width: 100%;
			min-height: inherit;
			max-height: inherit;
			align-items: center;
			margin-bottom: 0;
		}
		label {
			border: 3px dashed #ddd;
			display: flex;
			text-align: center;
			justify-content: center;
			color: rgb(135, 135, 135);
			position: relative;
			padding: 10px;
			cursor: pointer;
			user-select: none;
		}
		.image-preview {
			position: relative;
			display: flex;
			.image-wrapper {
				position: relative;
				width: fit-content;
				height: fit-content;
				max-height: inherit;
				display: flex;
				margin: auto;
				border-radius: 5px;
				overflow: hidden;
				img {
					max-width: 100%;
					max-height: inherit;
					margin: auto;
				}
				.img-overlay {
					opacity: 0;
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					background: rgba(0, 0, 0, 0.5);
					color: rgb(199, 199, 199);
					font-size: 2rem;
					transition: all 0.2s ease;
					.times-delete-image {
						position: absolute;
						top: 50%;
						left: 50%;
						transform: translate(-50%, -50%);
						cursor: pointer;
						transition: all 0.2s ease;
						&:hover {
							color: #fff;
							font-size: 2.5rem;
						}
					}
				}
				&:hover {
					.img-overlay {
						opacity: 1;
					}
				}
			}
		}
		&.active {
			label {
				border-color: transparent;
				background: linear-gradient(90deg, var(--primary) 50%, transparent 50%), linear-gradient(90deg, var(--primary) 50%, transparent 50%),
					linear-gradient(0deg, var(--primary) 50%, transparent 50%), linear-gradient(0deg, var(--primary) 50%, transparent 50%);
				background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
				background-size: 16px 4px, 16px 4px, 4px 16px, 4px 16px;
				background-position: 0% 0%, 100% 100%, 0% 100%, 100% 0px;
				border-radius: 16px;
				padding: 10px;
				animation: border-dance 5s linear infinite;
				@keyframes border-dance {
					to {
						background-position: 100% 0%, 0% 100%, 0% 0%, 100% 100%;
					}
				}
			}
		}
	}
</style>
