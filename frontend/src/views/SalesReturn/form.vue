<template>
	<main-content :breads="breads">
		<b-form @submit.prevent="handleSave">
			<b-row>
				<b-col cols="9">
					<b-card>
						<b-row cols="3">
							<!-- -------------Date------------- -->
							<b-col>
								<date-input :object="invoice" />
								<input-error :vuelidate="this.$v.invoice.date" field="date" :namespace="namespace" />
							</b-col>

							<!-- -------------Warehouse------------- -->
							<b-col>
								<warehouse-input :object="invoice" />
								<input-error :vuelidate="this.$v.invoice.warehouse_id" field="warehouse_id" :namespace="namespace" />
							</b-col>

							<!-- -------------Supplier------------- -->
							<b-col>
								<customer-input :object="invoice" />
								<input-error :vuelidate="this.$v.invoice.customer_id" field="customer_id" :namespace="namespace" />
							</b-col>
						</b-row>
					</b-card>

					<!-- -------------Product Search------------- -->
					<b-card class="my-30px">
						<products-auto-complete :invoice="invoice" :amountType="amountType" />
						<input-error :vuelidate="this.$v.invoice.products" field="products" :namespace="namespace" />
					</b-card>

					<!-- -------------Products Table------------- -->
					<b-card>
						<invoice-details-table :invoice="invoice" :amountType="amountType" :namespace="namespace" :net="net" />
					</b-card>

					<!-- -------------Notes------------- -->
					<b-card class="mt-30px">
						<note-input :object="invoice" />
						<input-error :vuelidate="this.$v.invoice.note" field="note" :namespace="namespace" />
						<div class="text-right">
							<b-btn :variant="`${isUpdate ? 'success' : 'primary'}`" type="submit">save</b-btn>
						</div>
					</b-card>
				</b-col>

				<b-col cols="3">
					<b-card>
						<b-row cols="1">
							<!-- -------------Shipping Cost------------- -->
							<b-col>
								<shipping-input :object="invoice" />
								<input-error :vuelidate="this.$v.invoice.shipping" field="shipping" :namespace="namespace" />
							</b-col>

							<!-- -------------Order Tax------------- -->
							<b-col>
								<tax-input :object="invoice" />
								<input-error :vuelidate="this.$v.invoice.tax" field="tax" :namespace="namespace" />
							</b-col>

							<!-- -------------Discount------------- -->
							<b-col>
								<discount-input :object="invoice" />
								<input-error :vuelidate="this.$v.invoice.discount" field="discount" :namespace="namespace" />
							</b-col>

							<!-- -------------Status------------- -->
							<b-col>
								<invoice-status-input :invoice="invoice" :namespace="namespace" />
								<input-error :vuelidate="this.$v.invoice.status" field="status" :namespace="namespace" />
							</b-col>
						</b-row>
					</b-card>

					<!-- -------------Invoice Details------------- -->
					<b-card class="mt-30px">
						<invoice-details :invoice="invoice" :amountType="amountType" :net="net" />
					</b-card>
				</b-col>
			</b-row>
		</b-form>
	</main-content>
</template>

<script>
	import { invoiceMixin } from "@/mixins";
	export default {
		mixins: [invoiceMixin],

		data() {
			return { namespace: "SalesReturn", amountType: "price" };
		},

		computed: {
			breads() {
				let breads = [
					{ title: "Dashboard", link: "/" },
					{ title: "Sales return", link: "/sales-return" }
				];

				if (this.isUpdate) {
					breads = [...breads, { title: this.oldInvoice.reference, link: `/sales-return/${this.invoiceId}` }, { title: "Edit" }];
				} else {
					breads.push({ title: "Create" });
				}

				return breads;
			}
		}
	};
</script>
