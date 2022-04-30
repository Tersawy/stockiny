<template>
	<b-modal
		:id="id"
		hide-footer
		no-close-on-esc
		no-close-on-backdrop
		size="lg"
		centered
		header-class="py-2"
		modal-class="gallery-modal"
		content-class="shadow-sm"
		@hidden="onHidden"
		@show="onShow"
	>
		<template #modal-header>
			<div class="d-flex align-items-center justify-content-between w-100">
				<span class="mb-0 font-default">{{ title }}</span>
				<div class="d-flex align-items-center">
					<b-btn variant="outline-dark" @click="close" size="sm" :disabled="loading.isBusy"> Close </b-btn>
				</div>
			</div>
		</template>

		<b-nav tabs>
			<!-- All Images Tab -->
			<b-nav-item :active="mainTabs.allImages" @click="changeTab('allImages')">All Images</b-nav-item>

			<!-- Variant Images Tab -->
			<b-nav-item :active="mainTabs.oldSelected" @click="changeTab('oldSelected')" v-if="!hideOldSelectedView">Variant Images</b-nav-item>

			<!-- Upload To Gallery Tab -->
			<b-nav-item :active="mainTabs.uploadToGallery" @click="changeTab('uploadToGallery')">Upload To Gallery</b-nav-item>
		</b-nav>

		<!-- All Images Body -->
		<div v-if="mainTabs.allImages" class="w-100 d-flex flex-column" :class="{ 'justify-content-center': !gallery.length }" style="min-height: 318px; max-height: 500px">
			<div style="overflow-y: auto" class="mx-n2 mx-sm-0 mx-md-n2 mx-lg-0">
				<div v-if="!gallery || !gallery.length" class="w-100 d-flex align-items-center justify-content-center text-muted">There are no images in the gallery.</div>

				<b-container v-else class="px-3">
					<b-row cols="2" cols-sm="2" cols-md="3" cols-lg="4" class="mx-n3 pt-3">
						<b-col v-for="image in gallery" :key="image" class="mb-3 mb-sm-4 mb-md-3 mb-lg-4 px-2 px-sm-3 px-md-2 px-lg-3">
							<div
								style="height: 140px"
								class="gallery-image shadow-sm border rounded"
								@click="select(image)"
								:class="{ selected: isSelected(image), active: isOldSelected(image) && isSelected(image), inactive: isOldSelected(image) && !isSelected(image) }"
							>
								<CheckCircleIcon class="selected-icon" />
								<b-img :src="imageFormatter(image)" thumbnail rounded class="h-100 w-100 p-2 border-transparent"></b-img>
							</div>
						</b-col>
					</b-row>
				</b-container>
			</div>
			<div class="pt-3 mt-auto d-flex justify-content-between align-items-center flex-sm-row w-100" v-if="showControls" :class="{ 'flex-column': selected.length }">
				<div class="mb-2 mb-sm-0" v-if="selected.length">Selected ( {{ selected.length }} )</div>
				<div class="mx-auto mr-sm-0">
					<b-btn
						variant="danger"
						size="sm"
						class="ml-auto mr-2 px-3"
						style="font-size: 0.8rem"
						v-if="selected.length && !hideDeleteBtn"
						:disabled="loading.isBusy"
						@click="deleteFromGallery"
					>
						Delete From Gallery
						<b-spinner small class="mx-1" style="margin-bottom: -2px" v-if="loading.deleteLoading" />
					</b-btn>
					<b-btn
						variant="primary"
						size="sm"
						class="ml-auto px-4"
						style="font-size: 0.8rem"
						:disabled="loading.isBusy || selectedChanged"
						@click="handleSave"
						v-if="!hideSaveBtn"
					>
						Save
						<b-spinner small class="mx-1" style="margin-bottom: -2px" v-if="loading.saveLoading" />
					</b-btn>
				</div>
			</div>
		</div>

		<!-- Variant Images Body -->
		<div
			v-if="mainTabs.oldSelected"
			class="w-100 d-flex flex-column"
			:class="{ 'justify-content-center': !oldSelected.length }"
			style="min-height: 318px; max-height: 500px"
		>
			<div style="overflow-y: auto" class="mx-n2 mx-sm-0 mx-md-n2 mx-lg-0">
				<div v-if="!oldSelected.length" class="w-100 d-flex align-items-center justify-content-center text-muted">There are no images for this variant.</div>

				<b-container v-else class="px-3">
					<b-row cols="2" cols-sm="2" cols-md="3" cols-lg="4" class="mx-n3 pt-3">
						<b-col v-for="image in oldSelected" :key="image" class="mb-3 mb-sm-4 mb-md-3 mb-lg-4 px-2 px-sm-3 px-md-2 px-lg-3">
							<div
								style="height: 140px"
								class="gallery-image shadow-sm border rounded"
								@click="setDefault(image)"
								:class="{
									active: isDefaultSelected(image),
									inactive: isDefaultOldSelected(image) && !isDefaultSelected(image)
								}"
							>
								<CheckCircleIcon class="selected-icon" />
								<b-img :src="imageFormatter(image)" thumbnail rounded class="h-100 w-100 p-2 border-transparent"></b-img>
							</div>
						</b-col>
					</b-row>
				</b-container>
			</div>
			<div class="pt-3 mt-auto text-center" v-if="showSetDefaultBtn">
				<b-btn variant="primary" size="sm" class="px-4" style="font-size: 0.8rem" :disabled="loading.isBusy" @click="handleSetDefaultImage">
					Set as a default
					<b-spinner small class="mx-1" style="margin-bottom: -2px" v-if="loading.saveLoading" />
				</b-btn>
			</div>
		</div>

		<!-- Upload To Gallery Body -->
		<div v-show="mainTabs.uploadToGallery" class="w-100 pt-3">
			<ImageUploader ref="imageUploader" :max="10" v-model="images" :beforeUpload="beforeUploadImage" multiple :disabled="loading.isBusy" />
			<InputError :customError="uploaderError" class="text-center" />

			<div class="text-center mt-3" v-if="images && images.length">
				<b-btn variant="primary" class="px-5" :disabled="loading.isBusy" @click="uploadToGallery">
					<CloudIcon />
					Upload
					<b-spinner small class="mx-1" style="margin-bottom: -2px" v-if="loading.isBusy" />
				</b-btn>
			</div>
		</div>
	</b-modal>
</template>

<script>
import CloudIcon from "@/components/icons/cloud";

import CheckCircleIcon from "@/components/icons/check-circle";

const InputError = () => import("@/components/InputError");

const ImageUploader = () => import("@/components/inputs/ImageUploader/index");

export default {
	components: { ImageUploader, InputError, CloudIcon, CheckCircleIcon },

	props: {
		id: { type: String, default: "galleryModal" },

		title: { type: String, default: "Gallery" },

		imageFormatter: { type: Function, default: (image) => image },

		galleryUrl: { type: String, required: true },

		uploadUrl: {
			type: String,
			default: function () {
				return this.galleryUrl;
			}
		},

		deleteUrl: {
			type: String,
			default: function () {
				return this.galleryUrl;
			}
		},

		multipleSelect: { type: Boolean, default: false },

		hideOldSelectedView: { type: Boolean, default: true },

		hideSaveBtn: { type: Boolean, default: false },

		hideDeleteBtn: { type: Boolean, default: false },

		oldSelected: { type: Array, default: () => [] },

		defaultOldSelected: { type: String, default: "" },

		beforeDelete: { type: Function, default: () => {} }
	},

	data() {
		return {
			mainTabs: { allImages: true, oldSelected: false, uploadToGallery: false },

			images: [],

			gallery: [],

			uploaderError: { field: "", message: { type: "" } },

			selected: [],

			defaultSelected: "", // for oldSelected

			loading: {
				isBusy: false,

				saveLoading: false,

				deleteLoading: false
			}
		};
	},

	watch: {
		"loading.isBusy"(v) {
			if (!v) {
				this.loading.saveLoading && (this.loading.saveLoading = false);
				this.loading.deleteLoading && (this.loading.deleteLoading = false);
			}
		},

		"loading.saveLoading"(v) {
			this.loading.isBusy = v;
		},

		"loading.deleteLoading"(v) {
			this.loading.isBusy = v;
		},

		defaultOldSelected: {
			handler(v) {
				this.defaultSelected = v;
			},
			deep: true
		},

		oldSelected: {
			handler(v) {
				this.selected = v.filter((image) => this.gallery.includes(image));
			},
			deep: true
		}
	},

	computed: {
		selectedChanged() {
			let countEqual = this.selected.length === this.oldSelected.length;

			if (countEqual) {
				countEqual = this.selected.every((image) => this.oldSelected.includes(image));
			}

			return countEqual;
		},

		showControls() {
			return this.selected.length > 0 || (this.oldSelected.length > 0 && this.selected.length === 0);
		},

		showSetDefaultBtn() {
			return this.oldSelected.length > 0 && this.defaultSelected && this.defaultOldSelected != this.defaultSelected;
		}
	},

	methods: {
		async getGallery() {
			try {
				const response = await this.$axios.get(this.galleryUrl);

				this.gallery = response.files;
			} catch (error) {
				console.error(error);
			}
		},

		async uploadToGallery() {
			this.loading.isBusy = true;

			let formData = new FormData();

			this.images.forEach((image) => formData.append("images", image));

			try {
				await this.$axios.put(this.uploadUrl, formData, { headers: { "Content-Type": "multipart/form-data" } });

				await this.getGallery();

				this.$refs.imageUploader.$reset();

				this.$nextTick(() => this.changeTab("allImages"));
			} catch (error) {
				console.log(error);
				this.uploaderError = error;
			} finally {
				this.loading.isBusy = false;
			}
		},

		async deleteFromGallery() {
			let prevented = false;

			let prevent = () => (prevented = true);

			await this.beforeDelete(this.selected, prevent);

			if (prevented) return;

			this.loading.isBusy = true;

			try {
				await this.$axios.post(this.deleteUrl, { images: this.selected });

				await this.getGallery();

				this.$refs.imageUploader.$reset();

				this.selected = [];
			} catch (error) {
				console.log(error);
				this.uploaderError = error;
			} finally {
				this.loading.isBusy = false;
			}
		},

		handleSave() {
			this.$emit("save", this.selected, this.loading);
		},

		handleSetDefaultImage() {
			this.$emit("setDefault", this.defaultSelected, this.loading);
		},

		select(image) {
			if (this.loading.isBusy) return;

			if (this.multipleSelect) {
				if (this.isSelected(image)) {
					this.selected = this.selected.filter((selectedImage) => selectedImage !== image);
				} else {
					this.selected.push(image);
				}
			} else {
				if (this.isSelected(image)) {
					this.selected = [];
				} else {
					this.selected = [image];
				}
			}
		},

		isSelected(image) {
			return this.selected.includes(image);
		},

		isOldSelected(image) {
			return this.oldSelected.includes(image);
		},

		setDefault(image) {
			if (this.loading.isBusy) return;
			this.defaultSelected = image;
		},

		isDefaultOldSelected(image) {
			return this.defaultOldSelected == image;
		},

		isDefaultSelected(image) {
			return this.defaultSelected == image;
		},

		open() {
			this.$bvModal.show(this.id);
		},

		close() {
			this.$reset();
			this.$nextTick(() => this.$bvModal.hide(this.id));
		},

		async onShow() {
			this.changeTab("allImages");

			this.$reset();

			await this.getGallery();

			if (this.oldSelected.length) {
				this.selected = this.oldSelected.filter((image) => this.gallery.includes(image));

				this.defaultSelected = this.defaultOldSelected;
			}
		},

		onHidden() {
			this.$reset();
			this.$emit("hide");
		},

		$reset() {
			this.selected = [];

			this.images = [];

			this.loading = { isBusy: false, saveLoading: false, deleteLoading: false };

			this.$refs.imageUploader?.$reset();

			this.defaultSelected = "";
		},

		changeTab(field) {
			if (this.loading.isBusy) return;

			for (let key in this.mainTabs) {
				this.mainTabs[key] = false;
			}

			this.mainTabs[field] = true;
		},

		beforeUploadImage(err) {
			if (err) {
				this.uploaderError = { field: "Image", message: err };
			} else {
				this.uploaderError = { field: "Image", message: { type: "" } };
			}
		}
	}
};
</script>

<style lang="scss">
.gallery-modal + .modal-backdrop {
	background-color: #000;
	opacity: 0.15;
}

.gallery-image {
	position: relative;
	user-select: none;
	cursor: pointer;
	transition: all 0.1s ease-in-out;
	box-shadow: 0 0.125rem 0.25rem #00000013 !important;

	.selected-icon {
		position: absolute;
		transition: all 0.15s ease-in-out;
		opacity: 0;
		transform: translate(-50%, -50%);
		left: 50%;
		top: 50%;
	}

	&:hover {
		box-shadow: 0 0.5rem 1rem #00000026 !important;
		transform: scale(1.01);
	}

	&.active,
	&.selected {
		box-shadow: 0 0.125rem 0.25rem #00000013 !important;
		transform: scale(0.95);

		.selected-icon {
			opacity: 1;
		}
	}

	&.selected {
		border-color: var(--success) !important;

		img {
			border-color: var(--success) !important;
		}
	}

	&.active {
		border-color: var(--primary) !important;

		.selected-icon {
			background-color: var(--primary) !important;
		}

		img {
			border-color: var(--primary) !important;
		}
	}

	&.inactive {
		border-color: var(--warning) !important;
	}
}
</style>
