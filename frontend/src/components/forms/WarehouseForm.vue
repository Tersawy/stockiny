<template>
	<default-modal id="warehouseFormModal" @ok="handleSave" @hidden="resetForm" :isBusy="isBusy" :title="formTitle" @show="isOpened" :settings="modalSettings">
		<div class="warehouse-form">
			<b-form v-on:submit="handleSave">
				<b-row cols="1" cols-md="2">
					<!-- Name Input -->
					<b-col>
						<default-input ref="inputName" label="Name" placeholder="Enter Warehouse Name" field="name" :vuelidate="$v.warehouse" namespace="Warehouses" />
					</b-col>
					<!-- Phone Input -->
					<b-col>
						<default-input label="Phone" placeholder="Enter Warehouse Phone" field="phone" type="tel" :vuelidate="$v.warehouse" namespace="Warehouses" />
					</b-col>
					<!-- Email Input -->
					<b-col>
						<default-input label="Email" placeholder="Enter Warehouse Email" field="email" type="email" :vuelidate="$v.warehouse" namespace="Warehouses" />
					</b-col>
					<!-- Country Input -->
					<b-col>
						<default-input label="Country" placeholder="Enter Warehouse Country" field="country" :vuelidate="$v.warehouse" namespace="Warehouses" />
					</b-col>
					<!-- City Input -->
					<b-col>
						<default-input label="City" placeholder="Enter Warehouse City" field="city" :vuelidate="$v.warehouse" namespace="Warehouses" />
					</b-col>
					<!-- Address Input -->
					<b-col>
						<default-input label="Address" placeholder="Enter Warehouse Address" field="address" :vuelidate="$v.warehouse" namespace="Warehouses" />
					</b-col>
					<!-- Zip Code Input -->
					<b-col>
						<default-input label="Zip Code" placeholder="Enter Warehouse Zip Code" field="zipCode" :vuelidate="$v.warehouse" namespace="Warehouses" />
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
		warehouse: { name: null, phone: null, email: null, country: null, city: null, address: null, zipCode: null },
		isBusy: false,
		modalSettings: {
			stayOpen: false,
			showStayOpenBtn: true
		}
	}),

	validations: {
		warehouse: {
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
			oldWarehouse: (state) => state.Warehouses.one
		}),

		isUpdate() {
			return !!this.oldWarehouse._id;
		},

		formTitle() {
			return this.isUpdate ? "Edit Warehouse" : "Create Warehouse";
		}
	},

	methods: {
		...mapActions("Warehouses", ["create", "update", "getOptions"]),

		isOpened() {
			if (this.isUpdate) {
				for (let key in this.warehouse) {
					this.warehouse[key] = this.oldWarehouse[key] || "";
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

			if (this.$v.warehouse.$invalid) return;

			this.isBusy = true;

			try {
				let action = this.isUpdate ? this.update : this.create;

				let res = await action(this.warehouse);

				let message = "actions.created";

				if (res.status == 200) {
					message = "actions.updated";
				}

				this.getOptions();

				message = this.$t(message, { module: "Warehouse" });

				this.$store.commit("showToast", message);

				this.resetForm();

				if (!this.modalSettings.showStayOpenBtn || !this.modalSettings.stayOpen) {
					return this.$bvModal.hide("warehouseFormModal");
				}

				this.$refs?.inputName?.$children[0]?.$children[0]?.focus();
			} catch (e) {
				this.$store.commit("Warehouses/setError", e);
			} finally {
				this.isBusy = false;
			}
		},

		resetForm() {
			for (let key in this.warehouse) {
				this.warehouse[key] = "";
			}

			this.$store.commit("Warehouses/setOne", {});

			this.$store.commit("Warehouses/resetError");

			this.$nextTick(this.$v.$reset);
		}
	}
};
</script>
