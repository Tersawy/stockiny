<template>
	<main-content :breads="breads">
		<template #end-breads>
			<div class="d-flex align-items-center">
				<!-- Save Button -->
				<b-button variant="outline-primary" size="sm" @click="handleSave" :disabled="isBusy">
					Save
					<b-spinner v-if="isBusy" small class="mx-1"></b-spinner>
				</b-button>

				<!-- Cancel Button -->
				<b-button variant="outline-danger" size="sm" @click="handleCancel" :disabled="isBusy" class="ml-2"> Cancel </b-button>
			</div>
		</template>

		<b-form @submit.prevent="handleSave">
			<b-row>
				<b-col class="h-auto" cols="12" lg="8">
					<b-card header="Quotation Information" class="h-100">
						<b-row cols="1" cols-sm="2">
							<!--------------- Date Input --------------->
							<b-col cols="12" sm="6">
								<default-date-picker-input label="Date" field="date" :vuelidate="$v.invoice" namespace="Quotations" />
							</b-col>

							<!--------------- Warehouse Input --------------->
							<b-col cols="12" sm="6">
								<default-select label="Warehouse" field="warehouse" :options="warehouseOptions" :vuelidate="$v.invoice" namespace="Quotations" />
							</b-col>

							<!--------------- Customer Input --------------->
							<b-col>
								<default-select label="Customer" field="customer" :options="customerOptions" :vuelidate="$v.invoice" namespace="Quotations" />
							</b-col>

							<!-- -------------Shipping Cost Input------------- -->
							<b-col>
								<default-input label="Shipping Cost" field="shipping" append="$" :vuelidate="$v.invoice" namespace="Quotations" type="number" />
							</b-col>

							<!-- -------------Quotation Tax Input------------- -->
							<b-col>
								<default-input label="Tax" field="tax" append="%" :vuelidate="$v.invoice" namespace="Quotations" type="number" />
							</b-col>

							<!-- -------------Discount------------- -->
							<b-col>
								<discount-input :vuelidate="$v.invoice" namespace="Quotations" />
							</b-col>
						</b-row>
					</b-card>
				</b-col>

				<b-col cols="12" class="mt-4" order-lg="2">
					<!-- -------------Product Search------------- -->
					<b-card header="Quotation Details">
						<invoice-auto-complete :invoice="invoice" :product-options="productOptions" @add-to-detail="addToDetail" />
						<input-error :vuelidate-field="$v.invoice.details" field="details" namespace="Quotations" />

						<!-- -------------Products Table------------- -->
						<invoice-details-table
							ref="invoiceDetailsTable"
							:product-options="productOptions"
							class="mt-4"
							:invoice="invoice"
							amount-type="Price"
							namespace="Quotations"
						/>
					</b-card>
				</b-col>

				<b-col cols="12" lg="4" class="mt-4 mt-lg-0" order-lg="1">
					<!-- -------------Invoice Details------------- -->
					<b-card header="Quotation Total">
						<!-- -------------Status------------- -->
						<invoice-status-input :vuelidate="$v.invoice" namespace="Sales" @mounted="setEffectedStatus" />

						<invoice-total :invoice="invoice" amount-type="Price" />
					</b-card>
				</b-col>

				<b-col class="mt-4" order="3">
					<!-- -------------Notes------------- -->
					<b-card header="Quotation Notes">
						<default-text-area rows="4" class="mb-0" placeholder="Enter Quotation Notes" field="notes" :vuelidate="$v.invoice" namespace="Quotations" />
					</b-card>
				</b-col>
			</b-row>
		</b-form>

		<default-modal id="quantityErrors" :showStayOpenBtn="false" :showOkBtn="false" title="Quantity Errors" :modalProps="{ headerClass: 'py-3', centered: true }">
			<template #btn-close="{ close }">
				<b-btn variant="outline-primary" size="sm" @click="close">Close</b-btn>
			</template>

			<b-table :fields="quantityErrors.tableFields" :items="quantityErrors.errors">
				<template #cell(productName)="row">
					<div class="mb-2">
						<strong>{{ row.value }}</strong>
						<small class="text-nowrap text-muted"> ( {{ row.item.variantName }} ) </small>
					</div>
				</template>

				<template #cell(stockBefore)="row">
					<b-badge variant="outline-warning"> {{ row.value | floating }} {{ row.item.unitName }} </b-badge>
				</template>

				<template #cell(stockAfter)="row">
					<b-badge variant="outline-danger"> {{ row.value | floating }} {{ row.item.unitName }} </b-badge>
				</template>
			</b-table>
		</default-modal>
	</main-content>
</template>

<script>
import { invoiceMixin } from "@/mixins";

export default {
	mixins: [invoiceMixin("Quotations", "Price")],

	data() {
		let isEdit = this.$route.params.id;

		return {
			breads: [{ title: "Dashboard", link: "/" }, { title: "Quotations", link: "/quotations" }, { title: isEdit ? "Edit" : "Create" }]
		};
	},

	computed: {
		productOptions() {
			return this.$store.getters["Products/options"]("quotation", this.invoice.warehouse);
		}
	},

	methods: {
		getProductOptions(payload) {
			return this.$store.dispatch("Products/getOptions", { ...payload, type: "quotation" });
		}
	}
};
</script>
