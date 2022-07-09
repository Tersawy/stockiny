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
					<b-card header="Sale Information" class="h-100">
						<b-row cols="1" cols-sm="2">
							<!--------------- Date Input --------------->
							<b-col cols="12" sm="6">
								<default-date-picker-input label="Date" field="date" :vuelidate="$v.invoice" namespace="Sales" />
							</b-col>

							<!--------------- Warehouse Input --------------->
							<b-col cols="12" sm="6">
								<default-select label="Warehouse" field="warehouse" :options="warehouseOptions" :vuelidate="$v.invoice" namespace="Sales" />
							</b-col>

							<!--------------- Customer Input --------------->
							<b-col>
								<default-select label="Customer" field="customer" :options="customerOptions" :vuelidate="$v.invoice" namespace="Sales" />
							</b-col>

							<!-- -------------Shipping Cost Input------------- -->
							<b-col>
								<default-input label="Shipping Cost" field="shipping" append="$" :vuelidate="$v.invoice" namespace="Sales" type="number" />
							</b-col>

							<!-- -------------Sale Tax Input------------- -->
							<b-col>
								<default-input label="Tax" field="tax" append="%" :vuelidate="$v.invoice" namespace="Sales" type="number" />
							</b-col>

							<!-- -------------Discount------------- -->
							<b-col>
								<discount-input :vuelidate="$v.invoice" namespace="Sales" />
							</b-col>
						</b-row>
					</b-card>
				</b-col>

				<b-col cols="12" class="mt-4" order-lg="2">
					<!-- -------------Product Search------------- -->
					<b-card header="Sale Details">
						<invoice-auto-complete :options="productOptions" :selected="invoice.details" :on-select="addDetail" />
						<input-error :vuelidate-field="$v.invoice.details" field="details" namespace="Sales" />

						<!-- -------------Products Table------------- -->
						<invoice-details-table
							class="mt-4"
							namespace="Sales"
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
					<b-card header="Sale Total">
						<!-- -------------Status------------- -->
						<invoice-status-input :vuelidate="$v.invoice" namespace="Sales" @mounted="setEffectedStatus" />

						<invoice-total :invoice="invoice" amount-type="Price" />
					</b-card>
				</b-col>

				<b-col class="mt-4" order="3">
					<!-- -------------Notes------------- -->
					<b-card header="Sale Notes">
						<default-text-area rows="4" class="mb-0" placeholder="Enter Sale Notes" field="notes" :vuelidate="$v.invoice" namespace="Sales" />
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

		<InvoiceDetailForm unitLabel="Sale Unit" namespace="Sales" amountType="Price" :detail.sync="detail" @submit="updateDetail" />
	</main-content>
</template>

<script>
import { getDate } from "@/helpers";

import { invoiceMixin, invoiceDetailsMixin } from "@/mixins";

let detailsMixin = invoiceDetailsMixin({ storeNameSpace: "Sales", checkQuantity: true, amountType: "Price" });

export default {
	mixins: [invoiceMixin("Sales", "Price"), detailsMixin],

	data() {
		let isEdit = this.$route.params.id;

		return {
			breads: [{ title: "Dashboard", link: "/" }, { title: "Sales", link: "/sales" }, { title: isEdit ? "Edit" : "Create" }]
		};
	},

	async mounted() {
		if (this.isQuotation) {
			await this.getQuotation();

			this.invoice.date = getDate(this.quotation.date);
			this.invoice.customer = this.quotation.customer._id || this.quotation.customer;
			this.invoice.warehouse = this.quotation.warehouse._id || this.quotation.warehouse;
			this.invoice.shipping = this.quotation.shipping;
			this.invoice.tax = this.quotation.tax;
			this.invoice.discount = this.quotation.discount;
			this.invoice.notes = this.quotation.notes;
			this.invoice.status = this.quotation.status._id || this.quotation.status;

			setTimeout(() => {
				this.quotation.details.forEach((product) => this.addDetail(product));
			}, 300);
		}
	},

	computed: {
		productOptions() {
			return this.$store.getters["Products/options"]("sale", this.invoice.warehouse);
		},

		quotationId() {
			return this.$route.query.quotationId;
		},

		isQuotation() {
			return !!this.quotationId;
		},

		quotation() {
			return this.$store.state.Quotations.one;
		}
	},

	methods: {
		getProductOptions(payload) {
			return this.$store.dispatch("Products/getOptions", { ...payload, type: "sale" });
		},

		getQuotation() {
			return this.$store.dispatch("Quotations/getEdit", this.quotationId);
		}
	}
};
</script>
