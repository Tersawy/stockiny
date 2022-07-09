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
					<b-card header="Transfer Information" class="h-100">
						<b-row cols="1" cols-sm="2">
							<!--------------- Date Input --------------->
							<b-col cols="12" sm="6">
								<default-date-picker-input label="Date" field="date" :vuelidate="$v.invoice" namespace="Transfers" />
							</b-col>

							<!--------------- From Warehouse Input --------------->
							<b-col cols="12" sm="6">
								<default-select label="From Warehouse" field="fromWarehouse" :options="warehouseOptions" :vuelidate="$v.invoice" namespace="Transfers" />
							</b-col>

							<!--------------- To Warehouse Input --------------->
							<b-col>
								<default-select label="To Warehouse" field="toWarehouse" :options="toWarehouseOptions" :vuelidate="$v.invoice" namespace="Transfers" />
							</b-col>

							<!-- -------------Shipping Cost Input------------- -->
							<b-col>
								<default-input label="Shipping Cost" field="shipping" append="$" :vuelidate="$v.invoice" namespace="Transfers" type="number" />
							</b-col>

							<!-- -------------Tax Input------------- -->
							<b-col>
								<default-input label="Tax" field="tax" append="%" :vuelidate="$v.invoice" namespace="Transfers" type="number" />
							</b-col>

							<!-- -------------Discount------------- -->
							<b-col>
								<discount-input :vuelidate="$v.invoice" namespace="Transfers" />
							</b-col>
						</b-row>
					</b-card>
				</b-col>

				<b-col cols="12" class="mt-4" order-lg="2">
					<!-- -------------Product Search------------- -->
					<b-card header="Transfer Details">
						<invoice-auto-complete :options="productOptions" :selected="invoice.details" :on-select="addDetail" />
						<input-error :vuelidate-field="$v.invoice.details" field="details" namespace="Transfers" />

						<!-- -------------Products Table------------- -->
						<invoice-details-table
							class="mt-4"
							namespace="Transfers"
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
					<b-card header="Transfer Total">
						<!-- -------------Status------------- -->
						<invoice-status-input :vuelidate="$v.invoice" namespace="Transfers" @mounted="setEffectedStatus" />

						<invoice-total :invoice="invoice" amount-type="Cost" />
					</b-card>
				</b-col>

				<b-col class="mt-4" order="3">
					<!-- -------------Notes------------- -->
					<b-card header="Transfer Notes">
						<default-text-area rows="4" class="mb-0" placeholder="Enter Transfer Notes" field="notes" :vuelidate="$v.invoice" namespace="Transfers" />
					</b-card>
				</b-col>
			</b-row>
		</b-form>

		<default-modal
			id="quantityErrors"
			:showStayOpenBtn="false"
			:showOkBtn="false"
			title="Quantity Errors"
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
						<b-th colspan="3" class="text-center">From Warehouse</b-th>
						<b-th colspan="3" class="text-center">To Warehouse</b-th>
						<b-th rowspan="3" class="text-center" style="vertical-align: middle">Quantity</b-th>
					</b-tr>
					<b-tr>
						<b-th rowspan="2" class="text-center" style="vertical-align: middle">Name</b-th>
						<b-th colspan="2" class="text-center">Stock</b-th>
						<b-th rowspan="2" class="text-center" style="vertical-align: middle">Name</b-th>
						<b-th colspan="2" class="text-center">Stock</b-th>
					</b-tr>
					<b-tr>
						<b-th class="text-center">Before</b-th>
						<b-th class="text-center">After</b-th>
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
						<b-td variant="danger" class="font-weight-bold text-center text-nowrap">{{ error.fromWarehouse.name }}</b-td>
						<b-td class="text-center">
							<b-badge :variant="`outline-${error.fromWarehouse.instock.after < 0 ? 'danger' : 'success'}`">
								{{ error.fromWarehouse.instock.before | floating }} {{ error.unit.name }}
							</b-badge>
						</b-td>
						<b-td class="text-center">
							<b-badge :variant="`outline-${error.fromWarehouse.instock.after < 0 ? 'danger' : 'success'}`">
								{{ error.fromWarehouse.instock.after | floating }} {{ error.unit.name }}
							</b-badge>
						</b-td>
						<b-td variant="success" class="font-weight-bold text-center text-nowrap">{{ error.toWarehouse.name }}</b-td>
						<b-td class="text-center">
							<b-badge :variant="`outline-${error.toWarehouse.instock.after < 0 ? 'danger' : 'success'}`">
								{{ error.toWarehouse.instock.before | floating }} {{ error.unit.name }}
							</b-badge>
						</b-td>
						<b-td class="text-center">
							<b-badge :variant="`outline-${error.toWarehouse.instock.after < 0 ? 'danger' : 'success'}`">
								{{ error.toWarehouse.instock.after | floating }} {{ error.unit.name }}
							</b-badge>
						</b-td>
						<b-td class="text-center">
							<b-badge variant="outline-danger"> {{ error.quantity | floating }} {{ error.unit.name }} </b-badge>
						</b-td>
					</b-tr>
				</b-tbody>
			</b-table-simple>
		</default-modal>

		<InvoiceDetailForm unitLabel="Transfer By Unit" namespace="Transfers" amountType="Cost" :detail.sync="detail" @submit="updateDetail" />
	</main-content>
</template>

<script>
import { getDate } from "@/helpers";

import { invoiceMixin, invoiceDetailsMixin } from "@/mixins";

import { validationMixin } from "vuelidate";

import { required, numeric, minLength, maxLength, minValue } from "vuelidate/lib/validators";

import { showMessage } from "@/components/utils";

let detailsMixin = invoiceDetailsMixin({ storeNameSpace: "Transfers", checkQuantity: true, amountType: "Cost" });

export default {
	mixins: [invoiceMixin("Transfers", "Cost"), detailsMixin, validationMixin],

	data() {
		let isEdit = this.$route.params.id;

		return {
			breads: [{ title: "Dashboard", link: "/" }, { title: "Transfers", link: "/transfers" }, { title: isEdit ? "Edit" : "Create" }],

			invoice: {
				fromWarehouse: null,
				toWarehouse: null,
				tax: 0,
				discount: 0,
				discountMethod: "fixed",
				status: 0,
				shipping: 0,
				notes: null,
				date: getDate(null, true),
				totalAmount: 0,
				details: []
			},

			quantityErrors: []
		};
	},

	validations: {
		invoice: {
			fromWarehouse: { required },
			toWarehouse: { required },
			tax: { numeric, minValue: minValue(0) },
			discount: { numeric, minValue: minValue(0) },
			discountMethod: { required },
			status: { required },
			shipping: { numeric, minValue: minValue(0) },
			notes: { maxLength: maxLength(255) },
			date: { required },
			details: { required, minLength: minLength(1) }
		}
	},

	async mounted() {
		this.getUnitsOptions();
	},

	computed: {
		productOptions() {
			return this.$store.getters["Products/options"]("transfer", this.invoice.fromWarehouse);
		},

		toWarehouseOptions() {
			return this.warehouseOptions.filter((warehouse) => {
				if (this.invoice.fromWarehouse) {
					return warehouse._id !== this.invoice.fromWarehouse;
				}

				return true;
			});
		}
	},

	watch: {
		"invoice.fromWarehouse"(newValue, oldValue) {
			if (newValue) {
				this.invoice.details = [];

				this.invoice.toWarehouse = oldValue;

				this.$nextTick(this.$v.invoice.toWarehouse.$reset);

				this.getProductOptions({ warehouse: newValue });
			}
		}
	},

	methods: {
		async selfMounted() {
			this.getUnitsOptions();

			this.getWarehousesOpt();

			if (this.isUpdate) {
				await this.getInvoice(this.id);

				let breads = this.breads.splice(0, this.breads.length - 1); // remove last bread

				breads.push({ title: this.oldInvoice.reference, link: { name: "Transfer", params: { id: this.$route.params.id } } });

				this.breads = [...breads, { title: "Edit" }];

				this.invoice.date = getDate(this.oldInvoice.date);
				this.invoice.fromWarehouse = this.oldInvoice.fromWarehouse;
				this.invoice.tax = this.oldInvoice.tax;
				this.invoice.discount = this.oldInvoice.discount;
				this.invoice.discountMethod = this.oldInvoice.discountMethod;
				this.invoice.status = this.oldInvoice.status;
				this.invoice.shipping = this.oldInvoice.shipping;

				/* ! this is because we have a watcher on invoice.fromWarehouse set to oldValue
				 	so the watcher will be triggered after we set the value to invoice.fromWarehouse
					so we need to set the value to invoice.toWarehouse after we set the value to invoice.fromWarehouse to get the correct toWarehouse
				*/
				this.$nextTick(() => {
					this.invoice.toWarehouse = this.oldInvoice.toWarehouse;
				});

				setTimeout(() => {
					this.oldInvoice.details.forEach((product) => this.addDetail(product));
				}, 300);
			}
		},

		getProductOptions(payload) {
			return this.$store.dispatch("Products/getOptions", { ...payload, type: "transfer" });
		},

		async handleSave() {
			this.$v.$touch();

			if (this.$v.$invalid) return;

			this.isBusy = true;

			let details = this.invoice.details.map((selected) => ({
				amount: selected.subUnitAmount,
				quantity: selected.quantity,
				tax: selected.tax,
				taxMethod: selected.taxMethod,
				discount: selected.discount,
				discountMethod: selected.discountMethod,
				product: selected.product,
				variant: selected.variantId,
				subUnit: selected.subUnit
			}));

			let action = this.isUpdate ? this.update : this.create;

			try {
				let data = await action({ ...this.invoice, details });

				this.$router.push({ name: "Transfer", params: { id: data._id } });

				let message = this.isUpdate ? "messages.updated" : "messages.created";

				showMessage({ message: this.$t(message) });
			} catch (err) {
				if (err.status == 422 && err.type == "quantity") {
					this.quantityErrors = err.errors;

					this.$bvModal.show("quantityErrors");
				} else {
					this.$store.commit("Transfers/setError", err);
				}
			} finally {
				this.isBusy = false;
			}
		}
	}
};
</script>
