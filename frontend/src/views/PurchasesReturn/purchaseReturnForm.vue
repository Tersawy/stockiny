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
					<b-card header="Purchase Information" class="h-100">
						<b-row cols="1" cols-sm="2">
							<!--------------- Date Input --------------->
							<b-col cols="12" sm="6">
								<default-date-picker-input label="Date" field="date" :vuelidate="$v.invoice" namespace="PurchasesReturn" />
							</b-col>

							<!--------------- Warehouse Input --------------->
							<b-col cols="12" sm="6">
								<default-select label="Warehouse" field="warehouse" :options="warehouseOptions" :vuelidate="$v.invoice" namespace="PurchasesReturn" />
							</b-col>

							<!--------------- Supplier Input --------------->
							<b-col>
								<default-select label="Supplier" field="supplier" :options="supplierOptions" :vuelidate="$v.invoice" namespace="PurchasesReturn" />
							</b-col>

							<!-- -------------Shipping Cost Input------------- -->
							<b-col>
								<default-input label="Shipping Cost" field="shipping" append="$" :vuelidate="$v.invoice" namespace="PurchasesReturn" type="number" />
							</b-col>

							<!-- -------------Purchase Tax Input------------- -->
							<b-col>
								<default-input label="Tax" field="tax" append="%" :vuelidate="$v.invoice" namespace="PurchasesReturn" type="number" />
							</b-col>

							<!-- -------------Discount------------- -->
							<b-col>
								<discount-input :vuelidate="$v.invoice" namespace="PurchasesReturn" />
							</b-col>
						</b-row>
					</b-card>
				</b-col>

				<b-col cols="12" class="mt-4" order-lg="2">
					<!-- -------------Product Search------------- -->
					<b-card header="Purchase Details">
						<invoice-auto-complete :options="productOptions" :selected="invoice.details" :on-select="addDetail" />
						<input-error :vuelidate-field="$v.invoice.details" field="details" namespace="PurchasesReturn" />

						<!-- -------------Products Table------------- -->
						<invoice-details-table
							class="mt-4"
							namespace="PurchasesReturn"
							:details="invoice.details"
							:fields="detailsFields"
							@editDetail="editDetail"
							@removeDetail="removeDetail"
							@quantityChanged="quantityChanged"
							@decrementQuantity="decrementQuantity"
							@incrementQuantity="incrementQuantity"
						/>
					</b-card>
				</b-col>

				<b-col cols="12" lg="4" class="mt-4 mt-lg-0" order-lg="1">
					<!-- -------------Invoice Details------------- -->
					<b-card header="Purchase Total">
						<!-- -------------Status------------- -->
						<invoice-status-input :vuelidate="$v.invoice" namespace="PurchasesReturn" @mounted="setEffectedStatus" />

						<invoice-total :invoice="invoice" amount-type="Cost" />
					</b-card>
				</b-col>

				<b-col class="mt-4" order="3">
					<!-- -------------Notes------------- -->
					<b-card header="Purchase Notes">
						<default-text-area rows="4" class="mb-0" placeholder="Enter Purchase Notes" field="notes" :vuelidate="$v.invoice" namespace="PurchasesReturn" />
					</b-card>
				</b-col>
			</b-row>
		</b-form>

		<default-modal
			id="quantityErrors"
			:showStayOpenBtn="false"
			:showOkBtn="false"
			title=""
			:modalProps="{ headerClass: 'py-3', centered: true, size: 'xl', class: 'w-100' }"
			class="w-100"
		>
			<template #btn-close="{ close }">
				<b-btn variant="outline-primary" size="sm" @click="close">Close</b-btn>
			</template>
			<b-table-simple hover small responsive bordered>
				<b-thead>
					<b-tr>
						<b-th rowspan="3" class="text-center" style="vertical-align: middle">Product</b-th>
						<b-th colspan="3" class="text-center">Warehouse</b-th>
						<b-th rowspan="3" class="text-center" style="vertical-align: middle">Quantity</b-th>
					</b-tr>
					<b-tr>
						<b-th rowspan="2" class="text-center" style="vertical-align: middle">Name</b-th>
						<b-th colspan="2" class="text-center">Stock</b-th>
					</b-tr>
					<b-tr>
						<b-th class="text-center">Before</b-th>
						<b-th class="text-center">After</b-th>
					</b-tr>
				</b-thead>
				<b-tbody>
					<b-tr v-for="(error, i) in quantityErrors" :key="i">
						<b-th>
							<div class="mb-2">
								<strong class="text-nowrap"> {{ error.product.name }} </strong>
								<small class="text-nowrap text-muted"> ( {{ error.variant.name }} ) </small>
							</div>
						</b-th>
						<b-td variant="danger" class="font-weight-bold text-center text-nowrap">{{ error.warehouse.name }}</b-td>
						<b-td class="text-center">
							<b-badge :variant="`outline-${error.warehouse.instock.after < 0 ? 'danger' : 'success'}`">
								{{ error.warehouse.instock.before | floating }} {{ error.unit.name }}
							</b-badge>
						</b-td>
						<b-td class="text-center">
							<b-badge :variant="`outline-${error.warehouse.instock.after < 0 ? 'danger' : 'success'}`">
								{{ error.warehouse.instock.after | floating }} {{ error.unit.name }}
							</b-badge>
						</b-td>
						<b-td class="text-center">
							<b-badge variant="outline-danger"> {{ error.quantity | floating }} {{ error.unit.name }} </b-badge>
						</b-td>
					</b-tr>
				</b-tbody>
			</b-table-simple>
		</default-modal>

		<InvoiceDetailForm unitLabel="Purchase Unit" namespace="PurchasesReturn" amountType="Cost" :detail.sync="detail" @submit="updateDetail" />
	</main-content>
</template>

<script>
import { invoiceMixin, invoiceDetailsMixin } from "@/mixins";

let detailsMixin = invoiceDetailsMixin({ storeNameSpace: "PurchasesReturn", checkQuantity: true, amountType: "Cost" });

export default {
	mixins: [invoiceMixin("PurchasesReturn", "Cost"), detailsMixin],

	data() {
		let isEdit = this.$route.params.id;

		return {
			breads: [{ title: "Dashboard", link: "/" }, { title: "Purchases Return", link: "/purchases-return" }, { title: isEdit ? "Edit" : "Create" }]
		};
	},

	computed: {
		productOptions() {
			return this.$store.getters["Products/options"]("purchaseReturn", this.invoice.warehouse);
		}
	},

	methods: {
		getProductOptions(payload) {
			return this.$store.dispatch("Products/getOptions", { ...payload, type: "purchaseReturn" });
		}
	}
};
</script>
