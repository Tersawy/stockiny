<template>
	<default-modal id="variantFormModal" @ok="handleSave" @hidden="onHidden" :isBusy="isBusy" :title="formTitle" @show="isOpened" :settings="modalSettings">
		<div class="variant-form">
			<b-form v-on:submit="handleSave">
				<b-row cols="1">
					<!-- Name Input -->
					<b-col>
						<default-input ref="inputName" label="Name" placeholder="Enter Variant Name" field="name" :vuelidate="$v.productVariant" namespace="Products" />
					</b-col>
				</b-row>
				<input type="submit" hidden />
			</b-form>
		</div>
	</default-modal>
</template>

<script>
	import { mapActions, mapState } from "vuex";

	import { required, maxLength, minLength } from "vuelidate/lib/validators";

	import { validationMixin } from "vuelidate";

	const DefaultInput = () => import("@/components/ui/DefaultInput");

	const DefaultModal = () => import("@/components/ui/DefaultModal");

	export default {
		components: { DefaultModal, DefaultInput },

		mixins: [validationMixin],

		props: {
			variant: { type: Object }
		},

		data: () => ({
			isBusy: false,

			productVariant: { name: "" },

			modalSettings: { stayOpen: false, showStayOpenBtn: true }
		}),

		validations: {
			productVariant: {
				name: { required, minValue: minLength(3), maxLength: maxLength(54) }
			}
		},

		computed: {
			...mapState({
				product: (state) => state.Products.one
			}),

			isUpdate() {
				return !!this.productVariant?._id;
			},

			formTitle() {
				return this.isUpdate ? "Edit Variant" : "Create Variant";
			}
		},

		methods: {
			...mapActions("Products", ["addVariant", "updateVariant"]),

			isOpened() {
				this.productVariant = { ...(this.variant || this.productVariant) };

				if (this.isUpdate) {
					this.modalSettings.showStayOpenBtn = false;
				} else {
					this.modalSettings.showStayOpenBtn = true;
				}

				setTimeout(() => {
					this.$refs?.inputName?.$children[0]?.$children[0]?.focus();
				}, 300);
			},

			async handleSave(bvt) {
				bvt.preventDefault();

				this.$v.$touch();

				if (this.$v.productVariant.$invalid) return;

				this.isBusy = true;

				try {
					let action = this.isUpdate ? this.updateVariant : this.addVariant;

					let data = { ...this.productVariant, productId: this.product._id };

					let res = await action(data);

					let message = "actions.created";

					if (res.status == 200) {
						message = "actions.updated";
					}

					message = this.$t(message, { module: "Variant" });

					this.$store.commit("showToast", message);

					if (!this.modalSettings.showStayOpenBtn || !this.modalSettings.stayOpen) {
						return this.$bvModal.hide("variantFormModal");
					}

					this.resetForm();

					this.$refs?.inputName?.$children[0]?.$children[0]?.focus();
				} catch (e) {
					console.log(e);
					this.$store.commit("Products/setError", e);
				} finally {
					this.isBusy = false;
				}
			},

			onHidden() {
				this.resetForm();
				this.$emit("close");
			},

			resetForm() {
				this.productVariant = { name: "" };

				this.$store.commit("Products/resetError");

				this.$nextTick(this.$v.$reset);
			}
		}
	};
</script>
