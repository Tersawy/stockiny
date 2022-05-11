<template>
	<default-modal
		id="supplierFormModal"
		@ok="handleSave"
		@hidden="resetForm"
		:isBusy="isBusy"
		:title="formTitle"
		@show="isOpened"
		:stayOpen.sync="modalSettings.stayOpen"
		:showStayOpenBtn="modalSettings.showStayOpenBtn"
	>
		<div class="supplier-form">
			<b-form v-on:submit="handleSave">
				<b-row cols="1" cols-md="2">
					<!-- Name Input -->
					<b-col>
						<default-input ref="inputName" label="Name" placeholder="Enter Supplier Name" field="name" :vuelidate="$v.supplier" namespace="Suppliers" />
					</b-col>
					<!-- Phone Input -->
					<b-col>
						<default-input label="Phone" placeholder="Enter Supplier Phone" field="phone" type="tel" :vuelidate="$v.supplier" namespace="Suppliers" />
					</b-col>
					<!-- Email Input -->
					<b-col>
						<default-input label="Email" placeholder="Enter Supplier Email" field="email" type="email" :vuelidate="$v.supplier" namespace="Suppliers" />
					</b-col>
					<!-- Country Input -->
					<b-col>
						<default-input label="Country" placeholder="Enter Supplier Country" field="country" :vuelidate="$v.supplier" namespace="Suppliers" />
					</b-col>
					<!-- City Input -->
					<b-col>
						<default-input label="City" placeholder="Enter Supplier City" field="city" :vuelidate="$v.supplier" namespace="Suppliers" />
					</b-col>
					<!-- Address Input -->
					<b-col>
						<default-input label="Address" placeholder="Enter Supplier Address" field="address" :vuelidate="$v.supplier" namespace="Suppliers" />
					</b-col>
					<!-- Zip Code Input -->
					<b-col>
						<default-input label="Zip Code" placeholder="Enter Supplier Zip Code" field="zipCode" :vuelidate="$v.supplier" namespace="Suppliers" />
					</b-col>
				</b-row>
				<input type="submit" hidden />
			</b-form>
		</div>
	</default-modal>
</template>

<script>
import { mapActions, mapState } from "vuex";

import { required, minLength, maxLength, email, numeric } from "vuelidate/lib/validators";

import { validationMixin } from "vuelidate";

const DefaultInput = () => import("@/components/inputs/DefaultInput");

const DefaultModal = () => import("@/components/DefaultModal");

export default {
	components: { DefaultModal, DefaultInput },

	mixins: [validationMixin],

	data: () => ({
		supplier: { name: null, phone: null, email: null, country: null, city: null, address: null, zipCode: null },
		isBusy: false,
		modalSettings: {
			stayOpen: false,
			showStayOpenBtn: true
		}
	}),

	validations: {
		supplier: {
			name: { required, minLength: minLength(3), maxLength: maxLength(54) },
			phone: { required, numeric, minLength: minLength(6), maxLength: maxLength(18) },
			email: { required, email, minLength: minLength(6), maxLength: maxLength(254) },
			country: { required, minLength: minLength(3), maxLength: maxLength(54) },
			city: { required, minLength: minLength(3), maxLength: maxLength(54) },
			address: { required, minLength: minLength(3), maxLength: maxLength(54) },
			zipCode: { required, minLength: minLength(3), maxLength: maxLength(20) }
		}
	},

	computed: {
		...mapState({
			oldSupplier: (state) => state.Suppliers.one
		}),

		isUpdate() {
			return !!this.oldSupplier._id;
		},

		formTitle() {
			return this.isUpdate ? "Edit Supplier" : "Create Supplier";
		}
	},

	methods: {
		...mapActions("Suppliers", ["create", "update", "getOptions"]),

		isOpened() {
			if (this.isUpdate) {
				for (let key in this.supplier) {
					this.supplier[key] = this.oldSupplier[key] || "";
				}

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

			if (this.$v.supplier.$invalid) return;

			this.isBusy = true;

			try {
				let action = this.isUpdate ? this.update : this.create;

				let res = await action(this.supplier);

				let message = "actions.created";

				if (res.status == 200) {
					message = "actions.updated";
				}

				this.getOptions();

				message = this.$t(message, { module: "Supplier" });

				this.$store.commit("showToast", message);

				this.resetForm();

				if (!this.modalSettings.showStayOpenBtn || !this.modalSettings.stayOpen) {
					return this.$bvModal.hide("supplierFormModal");
				}

				this.$refs?.inputName?.$children[0]?.$children[0]?.focus();
			} catch (e) {
				this.$store.commit("Suppliers/setError", e);
			} finally {
				this.isBusy = false;
			}
		},

		resetForm() {
			for (let key in this.supplier) {
				this.supplier[key] = "";
			}

			this.$store.commit("Suppliers/setOne", {});

			this.$store.commit("Suppliers/resetError");

			this.$nextTick(this.$v.$reset);
		}
	}
};
</script>
