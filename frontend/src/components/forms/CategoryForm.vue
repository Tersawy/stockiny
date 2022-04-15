<template>
	<default-modal id="categoryFormModal" @ok="handleSave" @hidden="resetForm" :isBusy="isBusy" :title="formTitle" @show="isOpened" :settings="modalSettings">
		<div class="category-form">
			<b-form v-on:submit="handleSave">
				<b-row cols="1" cols-md="2">
					<!-- Name Input -->
					<b-col>
						<default-input ref="inputName" label="Name" placeholder="Enter Category Name" field="name" :vuelidate="$v.category" namespace="Categories" />
					</b-col>
					<!-- Code Input -->
					<b-col>
						<default-input label="Code" placeholder="Enter Category Code" field="code" :vuelidate="$v.category" namespace="Categories" />
					</b-col>
					<!-- Description Input -->
					<b-col md="12">
						<default-text-area label="Description" placeholder="Enter Category Description" field="description" :vuelidate="$v.category" namespace="Categories" />
					</b-col>
					<!-- Image Input -->
					<b-col md="12">
						<div class="d-flex justify-content-center">
							<div class="position-relative" v-if="imageSrc">
								<b-img rounded="circle" width="250" height="250" alt="Circle image" :src="imageSrc"> </b-img>
								<span style="font-size: 1.6rem; cursor: pointer" class="position-absolute" @click="removeImage">&times;</span>
							</div>
						</div>
						<default-file-input label="Image" placeholder="Upload Category Image" field="image" :vuelidate="$v.category" namespace="Categories" />
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

	const DefaultModal = () => import("@/components/ui/DefaultModal");

	const DefaultInput = () => import("@/components/ui/DefaultInput");

	const DefaultTextArea = () => import("@/components/ui/DefaultTextArea");

	const DefaultFileInput = () => import("@/components/ui/DefaultFileInput");

	export default {
		components: { DefaultModal, DefaultInput, DefaultTextArea, DefaultFileInput },

		mixins: [validationMixin],

		data: () => ({
			category: { name: null, code: null, description: "", image: null },

			imageSrc: null,

			isBusy: false,

			modalSettings: { stayOpen: false, showStayOpenBtn: true }
		}),

		validations: {
			category: {
				name: { required, minLength: minLength(3), maxLength: maxLength(54) },
				code: { required, minLength: minLength(3), maxLength: maxLength(20) },
				description: { maxLength: maxLength(254) },
				image: {}
			}
		},

		watch: {
			"category.image"(v) {
				if (v) {
					this.imageSrc = URL.createObjectURL(v);
				} else {
					this.imageSrc = null;
				}
			}
		},

		computed: {
			...mapState({
				oldCategory: (state) => state.Categories.one
			}),

			isUpdate() {
				return !!this.oldCategory?._id;
			},

			formTitle() {
				return this.isUpdate ? "Edit Category" : "Create Category";
			}
		},

		methods: {
			...mapActions("Categories", ["create", "update", "getOptions"]),

			removeImage() {
				this.category.image = null;
				this.imageSrc = null;
				if (this.isUpdate) {
					this.category.imageDeleted = true;
				}
			},

			isOpened() {
				if (this.isUpdate) {
					for (let key in this.category) {
						if (key === "image") {
							this.category[key] = null;
							continue;
						}

						this.category[key] = this.oldCategory[key] || "";
					}

					this.imageSrc = this.oldCategory.image ? `${this.BASE_URL}/images/categories/${this.oldCategory.image}` : null;

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

				if (this.$v.category.$invalid) return;

				this.isBusy = true;

				let data = this.category;

				if (this.category.image) {
					data = new FormData();

					for (let field in this.category) {
						data.set(field, this.category[field]);
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

					message = this.$t(message, { module: "Category" });

					this.$store.commit("showToast", message);

					this.resetForm();

					if (!this.modalSettings.showStayOpenBtn || !this.modalSettings.stayOpen) {
						return this.$bvModal.hide("categoryFormModal");
					}

					this.$refs?.inputName?.$children[0]?.$children[0]?.focus();
				} catch (e) {
					this.$store.commit("Categories/setError", e);
				} finally {
					this.isBusy = false;
				}
			},

			resetForm() {
				for (let key in this.category) {
					this.category[key] = key == "image" ? null : "";
				}

				this.imageSrc = null;

				this.$store.commit("Categories/setOne", {});

				this.$store.commit("Categories/resetError");

				this.$nextTick(this.$v.$reset);
			}
		}
	};
</script>
