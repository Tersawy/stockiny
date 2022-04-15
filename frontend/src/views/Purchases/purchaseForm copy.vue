<template>
	<main-content :breads="breads">
		<template #end-breads>
			<div class="d-flex align-items-center">
				<!-- Save Button -->
				<b-button variant="outline-primary" size="sm" @click="handleSave"> Save </b-button>

				<!-- Cancel Button -->
				<b-button variant="outline-danger" size="sm" @click="handleCancel" class="ml-2"> Cancel </b-button>
			</div>
		</template>
		<b-form @submit.prevent="handleSave">
			<b-row>
				<b-col cols="9">
					<b-card header="Purchase Information">
						<b-row cols="3">
							<!--------------- Date Input --------------->
							<b-col>
								<default-date-picker-input label="Date" field="date" :vuelidate="$v.invoice" namespace="Purchases" />
							</b-col>

							<!--------------- Warehouse Input --------------->
							<b-col>
								<default-select label="Warehouse" field="warehouse" :options="warehouseOptions" :vuelidate="$v.invoice" namespace="Purchases" />
							</b-col>

							<!--------------- Supplier Input --------------->
							<b-col>
								<default-select label="Supplier" field="supplier" :options="supplierOptions" :vuelidate="$v.invoice" namespace="Purchases" />
							</b-col>
						</b-row>
					</b-card>

					<!-- -------------Product Search------------- -->
					<b-card class="mt-4" header="Purchase Details">
						<invoice-auto-complete :check-quantity="false" :invoice="invoice" :product-options="productOptions" />
						<input-error :vuelidate="$v.invoice" field="details" namespace="Purchases" />

						<!-- -------------Products Table------------- -->
						<invoice-details-table class="mt-4" :invoice="invoice" amount-type="Cost" namespace="Purchases" />
					</b-card>

					<!-- -------------Notes------------- -->
					<b-card class="mt-4" header="Purchase Notes">
						<default-text-area rows="4" class="mb-0" placeholder="Enter Purchase Notes" field="notes" :vuelidate="$v.invoice" namespace="Purchases" />
					</b-card>
				</b-col>

				<b-col cols="3">
					<b-card header="Tax & Discount & Shipping">
						<b-row cols="1">
							<!-- -------------Shipping Cost Input------------- -->
							<b-col>
								<default-input label="Shipping Cost" field="shipping" append="$" :vuelidate="$v.invoice" namespace="Purchases" type="number" />
							</b-col>

							<!-- -------------Purchase Tax Input------------- -->
							<b-col>
								<default-input label="Purchase Tax" field="tax" append="%" :vuelidate="$v.invoice" namespace="Purchases" type="number" />
							</b-col>

							<!-- -------------Discount------------- -->
							<b-col>
								<discount-input :vuelidate="$v.invoice" namespace="Purchases" />
							</b-col>

							<!-- -------------Status------------- -->
							<b-col>
								<invoice-status-input :vuelidate="$v.invoice" invoiceName="purchases" namespace="Purchases" @mounted="setEffectedStatus" />
							</b-col>
						</b-row>
					</b-card>

					<!-- -------------Invoice Details------------- -->
					<b-card class="mt-4" header="Purchase Total" body-class="px-lg-1 px-xl-3">
						<invoice-total :invoice="invoice" amount-type="Cost" />
					</b-card>
				</b-col>
			</b-row>
		</b-form>
	</main-content>
</template>

<script>
	import { invoiceMixin } from "@/mixins";

	export default {
		mixins: [invoiceMixin("Purchases", "Cost")],

		data() {
			let isEdit = this.$route.params.invoiceId;

			return {
				breads: [{ title: "Dashboard", link: "/" }, { title: "Purchases", link: "/purchases" }, { title: isEdit ? "Edit" : "Create" }],

				namespace: "Purchases"
			};
		},

		methods: {
			handleCancel() {
				// this.resetForm();

				this.$router.push({ name: "Purchases" });
			}
		}
	};
</script>
