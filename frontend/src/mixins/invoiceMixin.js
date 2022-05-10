import { getDate } from "@/helpers";

const InvoiceAutoComplete = () => import("@/components/InvoiceAutoComplete");

const DiscountInput = () => import("@/components/inputs/DiscountInput");

const InvoiceStatusInput = () => import("@/components/inputs/InvoiceStatusInput");

const InvoiceDetailsTable = () => import("@/components/InvoiceDetailsTable");

const InvoiceTotal = () => import("@/components/InvoiceTotal");

const DefaultInput = () => import("@/components/inputs/DefaultInput");

const DefaultSelect = () => import("@/components/inputs/DefaultSelect");

const DefaultDatePickerInput = () => import("@/components/inputs/DefaultDatePickerInput");

const DefaultTextArea = () => import("@/components/inputs/DefaultTextArea");

const InputError = () => import("@/components/InputError");

const DefaultModal = () => import("@/components/DefaultModal");

import { mapActions, mapState } from "vuex";

import { required, numeric, minLength, maxLength, minValue } from "vuelidate/lib/validators";

import { validationMixin } from "vuelidate";

import { showMessage } from "@/components/utils";

export default (storeNamespace, amountType) => {
	return {
		components: {
			InvoiceDetailsTable,
			InvoiceTotal,
			InvoiceAutoComplete,
			InvoiceStatusInput,
			DiscountInput,
			DefaultInput,
			DefaultSelect,
			DefaultDatePickerInput,
			DefaultTextArea,
			InputError,
			DefaultModal
		},

		mixins: [validationMixin],

		data() {
			return {
				invoice: {
					customer: null,
					supplier: null,
					warehouse: null,
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

				isBusy: false,

				quantityErrors: {
					tableFields: [
						{ key: "productName", label: "Product" },
						{ key: "stockBefore", label: "Stock Before" },
						{ key: "stockAfter", label: "Stock After" },
						{ key: "warehouseName", label: "Warehouse" }
					],
					errors: []
				}
			};
		},

		validations() {
			let invoice = {
				warehouse: { required },
				tax: { numeric, minValue: minValue(0) },
				discount: { numeric, minValue: minValue(0) },
				discountMethod: { required },
				status: { required },
				shipping: { numeric, minValue: minValue(0) },
				notes: { maxLength: maxLength(255) },
				date: { required },
				details: { required, minLength: minLength(1) }
			};

			if (this.isPrice) {
				invoice.customer = { required };
			} else {
				invoice.supplier = { required };
			}

			return { invoice };
		},

		async mounted() {
			this.getUnitsOptions();

			this.getWarehousesOpt().then((data) => {
				if (!this.isUpdate) {
					if (data.options.length) {
						// !
						// TODO:: choise default warehouse from settings instead
						this.invoice.warehouse = data.options[0]._id;

						this.getProductOptions({ warehouse: this.invoice.warehouse });
					}
				}
			});

			if (this.isPrice) {
				this.getCustomersOpt();
			} else {
				this.getSuppliersOpt();
			}

			if (this.isUpdate) {
				await this.getInvoice(this.id);

				let breads = this.breads.splice(0, this.breads.length - 1); // remove last bread

				breads.push({ title: this.oldInvoice.reference, link: { name: storeNamespace.replace(/s(?=[A-Z])|s\b/g, ""), params: { id: this.id } } });

				this.breads = [...breads, { title: "Edit" }];

				this.invoice.date = getDate(this.oldInvoice.date);
				this.invoice.customer = this.oldInvoice.customer;
				this.invoice.supplier = this.oldInvoice.supplier;
				this.invoice.warehouse = this.oldInvoice.warehouse;
				this.invoice.tax = this.oldInvoice.tax;
				this.invoice.discount = this.oldInvoice.discount;
				this.invoice.discountMethod = this.oldInvoice.discountMethod;
				this.invoice.status = this.oldInvoice.status;
				this.invoice.shipping = this.oldInvoice.shipping;

				let sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

				await sleep(300);

				this.oldInvoice.details.forEach((product) => this.$refs.invoiceDetailsTable.addDetail(product));
			}
		},

		watch: {
			"invoice.warehouse": {
				handler(v) {
					if (v) {
						this.invoice.details = [];

						this.getProductOptions({ warehouse: v });
					}
				},
				deep: true
			}
		},

		computed: {
			...mapState({
				oldInvoice: (s) => s[storeNamespace].one,
				warehouseOptions: (s) => s.Warehouses.options,
				unitsOptions: (s) => s.Units.options,
				supplierOptions: (s) => s.Suppliers.options,
				customerOptions: (s) => s.Customers.options
			}),

			isPrice() {
				return amountType == "Price";
			},

			id() {
				return this.$route.params.id;
			},

			isUpdate() {
				return !!this.id;
			}
		},

		methods: {
			...mapActions({
				getWarehousesOpt: "Warehouses/getOptions",
				getUnitsOptions: "Units/getOptions",
				getSuppliersOpt: "Suppliers/getOptions",
				getCustomersOpt: "Customers/getOptions",
				create: storeNamespace + "/create",
				update: storeNamespace + "/update",
				getInvoice: storeNamespace + "/getEdit"
			}),

			// ? emmited from InvoiceStatusInput after component got statuses from api
			// TODO:: it can be removed from that component when we make that fetch in this mount
			setEffectedStatus(effectedOption) {
				if (!this.isUpdate) {
					this.invoice.status = effectedOption._id;
				}
			},

			// ? emmited from auto InvoiceAutoComplete to add product option to invoice details
			addToDetail(product) {
				this.$refs.invoiceDetailsTable.addDetail(product);
			},

			async handleSave() {
				this.$v.$touch();

				if (this.$v.$invalid) return;

				this.isBusy = true;

				let invoice = {
					warehouse: this.invoice.warehouse,
					tax: this.invoice.tax,
					discount: this.invoice.discount,
					discountMethod: this.invoice.discountMethod,
					status: this.invoice.status,
					shipping: this.invoice.shipping,
					date: this.invoice.date,
					notes: this.invoice.notes
				};

				if (this.isPrice) {
					invoice.customer = this.invoice.customer;
				} else {
					invoice.supplier = this.invoice.supplier;
				}

				invoice.details = this.invoice.details.map((selected) => ({
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
					let data = await action(invoice);

					let singleInvoiceName = storeNamespace.replace(/s(?=[A-Z])|s\b/g, "")

					this.$router.push({ name: singleInvoiceName, params: { id: data._id } });

					let message = this.isUpdate ? "messages.updated" : "messages.created";

					showMessage({ message: this.$t(message) });
				} catch (err) {
					if (err.status == 422 && err.type == "quantity") {
						this.quantityErrors.errors = err.errors;

						if (!this.isUpdate) {
							// remove warehouse in create because the invoice has only one warehouse
							this.quantityErrors.tableFields.pop();
						}

						this.$bvModal.show("quantityErrors");
					} else {
						this.$store.commit(`${storeNamespace}/setError`, err);
					}
				} finally {
					this.isBusy = false;
				}
			},

			handleCancel() {
				// this.resetForm();

				this.$router.push({ name: storeNamespace });
			}
		}

		// net(product) {
		// 	let { unitCost, unitPrice, tax, taxMethod, discount = 0, discountMethod = "fixed", quantity = 1 } = product;

		// 	let netCost, netPrice, taxCost, taxPrice, discountCost, discountPrice, totalCost, totalPrice, subtotalCost, subtotalPrice;

		// 	discountCost = discountMethod == "fixed" ? discount : discount * (unitCost / 100);
		// 	discountPrice = discountMethod == "fixed" ? discount : discount * (unitPrice / 100);

		// 	let costExcludingDiscount = unitCost - discountCost,
		// 		priceExcludingDiscount = unitPrice - discountPrice;

		// 	if (taxMethod == "inclusive") {
		// 		let taxDivide = 1 + tax / 100;

		// 		netCost = costExcludingDiscount / taxDivide;

		// 		netPrice = priceExcludingDiscount / taxDivide;

		// 		taxCost = costExcludingDiscount - netCost;

		// 		taxPrice = priceExcludingDiscount - netPrice;
		// 	} else {
		// 		netCost = costExcludingDiscount;

		// 		netPrice = priceExcludingDiscount;

		// 		taxCost = tax * (costExcludingDiscount / 100);

		// 		taxPrice = tax * (priceExcludingDiscount / 100);
		// 	}

		// 	totalCost = netCost + taxCost;
		// 	totalPrice = netPrice + taxPrice;

		// 	subtotalCost = quantity * totalCost;
		// 	subtotalPrice = quantity * totalPrice;

		// 	return {
		// 		cost: netCost,
		// 		price: netPrice,
		// 		taxCost,
		// 		taxPrice,
		// 		discountCost,
		// 		discountPrice,
		// 		totalCost,
		// 		totalPrice,
		// 		subtotalCost,
		// 		subtotalPrice
		// 	};
		// },
	};
};
