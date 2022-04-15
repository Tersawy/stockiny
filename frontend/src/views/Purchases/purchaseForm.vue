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
				<b-col class="h-auto" cols="12" lg="8">
					<b-card header="Purchase Information" class="h-100">
						<b-row cols="1" cols-sm="2">
							<!--------------- Date Input --------------->
							<b-col cols="12" sm="6">
								<default-date-picker-input label="Date" field="date" :vuelidate="$v.invoice" namespace="Purchases" />
							</b-col>

							<!--------------- Warehouse Input --------------->
							<b-col cols="12" sm="6">
								<default-select label="Warehouse" field="warehouse" :options="warehouseOptions" :vuelidate="$v.invoice" namespace="Purchases" />
							</b-col>

							<!--------------- Supplier Input --------------->
							<b-col>
								<default-select label="Supplier" field="supplier" :options="supplierOptions" :vuelidate="$v.invoice" namespace="Purchases" />
							</b-col>

							<!-- -------------Shipping Cost Input------------- -->
							<b-col>
								<default-input label="Shipping Cost" field="shipping" append="$" :vuelidate="$v.invoice" namespace="Purchases" type="number" />
							</b-col>

							<!-- -------------Purchase Tax Input------------- -->
							<b-col>
								<default-input label="Tax" field="tax" append="%" :vuelidate="$v.invoice" namespace="Purchases" type="number" />
							</b-col>

							<!-- -------------Discount------------- -->
							<b-col>
								<discount-input :vuelidate="$v.invoice" namespace="Purchases" />
							</b-col>
						</b-row>
					</b-card>
				</b-col>

				<b-col cols="12" class="mt-4" order-lg="2">
					<!-- -------------Product Search------------- -->
					<b-card header="Purchase Details">
						<invoice-auto-complete :invoice="invoice" :product-options="productOptions" @add-to-detail="addToDetail" />
						<input-error :vuelidate-field="$v.invoice.details" field="details" namespace="Purchases" />

						<!-- -------------Products Table------------- -->
						<invoice-details-table ref="invoiceDetailsTable" class="mt-4" :check-quantity="false" :invoice="invoice" amount-type="Cost" namespace="Purchases" />
					</b-card>
				</b-col>

				<b-col cols="12" lg="4" class="mt-4 mt-lg-0" order-lg="1">
					<!-- -------------Invoice Details------------- -->
					<b-card header="Purchase Total">
						<!-- -------------Status------------- -->
						<invoice-status-input :vuelidate="$v.invoice" invoiceName="purchases" namespace="Purchases" @mounted="setEffectedStatus" />

						<invoice-total :invoice="invoice" amount-type="Cost" />
					</b-card>
				</b-col>

				<b-col class="mt-4" order="3">
					<!-- -------------Notes------------- -->
					<b-card header="Purchase Notes">
						<default-text-area rows="4" class="mb-0" placeholder="Enter Purchase Notes" field="notes" :vuelidate="$v.invoice" namespace="Purchases" />
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
				breads: [{ title: "Dashboard", link: "/" }, { title: "Purchases", link: "/purchases" }, { title: isEdit ? "Edit" : "Create" }]
			};
		}
	};
</script>
