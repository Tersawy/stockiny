<template>
	<default-modal id="customerFormModal" @ok="handleSave" @hidden="resetForm" :isBusy="isBusy" :title="formTitle" @show="isOpened" :settings="modalSettings">
		<div class="customer-form">
			<b-form v-on:submit="handleSave">
				<b-row cols="1" cols-md="2">
					<!-- Name Input -->
					<b-col>
						<default-input ref="inputName" label="Name" placeholder="Enter Customer Name" field="name" :vuelidate="$v.customer" namespace="Customers" />
					</b-col>
					<!-- Phone Input -->
					<b-col>
						<default-input label="Phone" placeholder="Enter Customer Phone" field="phone" type="tel" :vuelidate="$v.customer" namespace="Customers" />
					</b-col>
					<!-- Email Input -->
					<b-col>
						<default-input label="Email" placeholder="Enter Customer Email" field="email" type="email" :vuelidate="$v.customer" namespace="Customers" />
					</b-col>
					<!-- Country Input -->
					<b-col>
						<default-input label="Country" placeholder="Enter Customer Country" field="country" :vuelidate="$v.customer" namespace="Customers" />
					</b-col>
					<!-- City Input -->
					<b-col>
						<default-input label="City" placeholder="Enter Customer City" field="city" :vuelidate="$v.customer" namespace="Customers" />
					</b-col>
					<!-- Address Input -->
					<b-col>
						<default-input label="Address" placeholder="Enter Customer Address" field="address" :vuelidate="$v.customer" namespace="Customers" />
					</b-col>
					<!-- Zip Code Input -->
					<b-col>
						<default-input label="Zip Code" placeholder="Enter Customer Zip Code" field="zipCode" :vuelidate="$v.customer" namespace="Customers" />
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

	const DefaultInput = () => import("@/components/ui/DefaultInput");
	const DefaultModal = () => import("@/components/ui/DefaultModal");

	export default {
		components: { DefaultModal, DefaultInput },

		mixins: [validationMixin],

		data: () => ({
			customer: { name: null, phone: null, email: null, country: null, city: null, address: null, zipCode: null },
			isBusy: false,
			modalSettings: {
				stayOpen: false,
				showStayOpenBtn: true
			}
		}),

		validations: {
			customer: {
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
				oldCustomer: (state) => state.Customers.one
			}),

			isUpdate() {
				return !!this.oldCustomer._id;
			},

			formTitle() {
				return this.isUpdate ? "Edit Customer" : "Create Customer";
			}
		},

		methods: {
			...mapActions("Customers", ["create", "update", "getOptions"]),

			isOpened() {
				if (this.isUpdate) {
					for (let key in this.customer) {
						this.customer[key] = this.oldCustomer[key] || "";
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

				if (this.$v.customer.$invalid) return;

				this.isBusy = true;

				try {
					let action = this.isUpdate ? this.update : this.create;

					let res = await action(this.customer);

					let message = "actions.created";

					if (res.status == 200) {
						message = "actions.updated";
					}

					this.getOptions();

					message = this.$t(message, { module: "Customer" });

					this.$store.commit("showToast", message);

					this.resetForm();

					if (!this.modalSettings.showStayOpenBtn || !this.modalSettings.stayOpen) {
						return this.$bvModal.hide("customerFormModal");
					}

					this.$refs?.inputName?.$children[0]?.$children[0]?.focus();
				} catch (e) {
					this.$store.commit("Customers/setError", e);
				} finally {
					this.isBusy = false;
				}
			},

			resetForm() {
				for (let key in this.customer) {
					this.customer[key] = "";
				}

				this.$store.commit("Customers/setOne", {});

				this.$store.commit("Customers/resetError");

				this.$nextTick(this.$v.$reset);
			}
		}
	};
</script>
