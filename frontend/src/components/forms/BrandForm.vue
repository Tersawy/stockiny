<template>
	<default-modal id="brandFormModal" @ok="handleSave" @hidden="resetForm" :isBusy="isBusy" :title="formTitle" @show="isOpened" :settings="modalSettings">
		<div class="brand-form">
			<b-form v-on:submit="handleSave">
				<b-row cols="1">
					<!-- Name Input -->
					<b-col>
						<default-input ref="inputName" label="Name" placeholder="Enter Brand Name" field="name" :vuelidate="$v.brand" namespace="Brands" />
					</b-col>
					<!-- Description Input -->
					<b-col md="12">
						<default-text-area label="Description" placeholder="Enter Brand Description" field="description" :vuelidate="$v.brand" namespace="Brands" />
					</b-col>
					<!-- Image Input -->
					<b-col md="12">
						<div class="d-flex justify-content-center">
							<div class="position-relative" v-if="imageSrc">
								<b-img rounded="circle" width="250" height="250" alt="Circle image" :src="imageSrc"> </b-img>
								<span style="font-size: 1.6rem; cursor: pointer" class="position-absolute" @click="removeImage">&times;</span>
							</div>
						</div>
						<default-file-input label="Image" placeholder="Upload Brand Image" field="image" :vuelidate="$v.brand" namespace="Brands" />
					</b-col>
				</b-row>
				<input type="submit" hidden />
			</b-form>
		</div>
	</default-modal>
</template>

<script>
import { mapActions, mapState } from "vuex";

import { required, minLength, maxLength } from "vuelidate/lib/validators";

import { validationMixin } from "vuelidate";

const DefaultModal = () => import("@/components/DefaultModal");

const DefaultInput = () => import("@/components/inputs/DefaultInput");

const DefaultTextArea = () => import("@/components/inputs/DefaultTextArea");

const DefaultFileInput = () => import("@/components/inputs/DefaultFileInput");

export default {
	components: { DefaultModal, DefaultInput, DefaultTextArea, DefaultFileInput },

	mixins: [validationMixin],

	data: () => ({
		brand: { name: null, description: "", image: null },

		imageSrc: null,

		isBusy: false,

		modalSettings: { stayOpen: false, showStayOpenBtn: true }
	}),

	validations: {
		brand: {
			name: { required, minLength: minLength(3), maxLength: maxLength(54) },
			description: { maxLength: maxLength(254) },
			image: {}
		}
	},

	watch: {
		"brand.image"(v) {
			if (v) {
				this.imageSrc = URL.createObjectURL(v);
			} else {
				this.imageSrc = null;
			}
		}
	},

	computed: {
		...mapState({
			oldBrand: (state) => state.Brands.one
		}),

		isUpdate() {
			return !!this.oldBrand?._id;
		},

		formTitle() {
			return this.isUpdate ? "Edit Brand" : "Create Brand";
		}
	},

	methods: {
		...mapActions("Brands", ["create", "update", "getOptions"]),

		removeImage() {
			this.brand.image = null;
			this.imageSrc = null;
			if (this.isUpdate) {
				this.brand.imageDeleted = true;
			}
		},

		isOpened() {
			if (this.isUpdate) {
				for (let key in this.brand) {
					if (key === "image") {
						this.brand[key] = null;
						continue;
					}

					this.brand[key] = this.oldBrand[key] || "";
				}

				this.imageSrc = this.oldBrand.image ? `${this.BASE_URL}/images/brands/${this.oldBrand.image}` : null;

				this.modalSettings.showStayOpenBtn = false;
			} else {
				this.resetForm();
				this.modalSettings.showStayOpenBtn = true;
			}

			setTimeout(() => {
				this.$refs?.inputName?.$children[0]?.$children[0]?.focus();
			}, 300);
		},

		async handleSave(bvt) {
			bvt.preventDefault();

			this.$v.$touch();

			if (this.$v.brand.$invalid) return;

			this.isBusy = true;

			let data = this.brand;

			if (this.brand.image) {
				data = new FormData();

				for (let field in this.brand) {
					data.set(field, this.brand[field]);
				}

				data = [data, { headers: { "Content-Type": "multipart/formdata" } }];
			}

			try {
				let action = this.isUpdate ? this.update : this.create;

				let res = await action(data);

				let message = "actions.created";

				if (res.status == 200) {
					message = "actions.updated";
				}

				this.getOptions();

				message = this.$t(message, { module: "Brand" });

				this.$store.commit("showToast", message);

				this.resetForm();

				if (!this.modalSettings.showStayOpenBtn || !this.modalSettings.stayOpen) {
					return this.$bvModal.hide("brandFormModal");
				}

				this.$refs?.inputName?.$children[0]?.$children[0]?.focus();
			} catch (e) {
				this.$store.commit("Brands/setError", e);
			} finally {
				this.isBusy = false;
			}
		},

		resetForm() {
			for (let key in this.brand) {
				this.brand[key] = key == "image" ? null : "";
			}

			this.imageSrc = null;

			this.$store.commit("Brands/setOne", {});

			this.$store.commit("Brands/resetError");

			this.$nextTick(this.$v.$reset);
		}
	}
};
</script>
