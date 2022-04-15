import { getDate } from "@/helpers";

const InvoiceAutoComplete = () => import("@/components/InvoiceAutoComplete");

const DiscountInput = () => import("@/components/ui/inputs/DiscountInput");

const InvoiceStatusInput = () => import("@/components/ui/inputs/InvoiceStatusInput");

const InvoiceDetailsTable = () => import("@/components/InvoiceDetailsTable");

const InvoiceTotal = () => import("@/components/InvoiceTotal");

const DefaultInput = () => import("@/components/ui/DefaultInput");

const DefaultSelect = () => import("@/components/ui/DefaultSelect");

const DefaultDatePickerInput = () => import("@/components/ui/DefaultDatePickerInput");

const DefaultTextArea = () => import("@/components/ui/DefaultTextArea");

const InputError = () => import("@/components/ui/InputError");

import { mapActions, mapState } from "vuex";

import { required, numeric, minLength, maxLength, minValue } from "vuelidate/lib/validators";

import { validationMixin } from "vuelidate";

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
			InputError
		},

		mixins: [validationMixin],

		data() {
			let invoice = {
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
			};

			return { invoice };
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

						if (this.isPrice) {
							this.getSaleOptions({ warehouse: this.invoice.warehouse });
						} else {
							this.getPurchaseOptions({ warehouse: this.invoice.warehouse });
						}
					}
				}
			});

			if (this.isPrice) {
				this.getCustomersOpt();
			} else {
				this.getSuppliersOpt();
			}

			if (this.isUpdate) {
				await this.getInvoice(this.invoiceId);

				this.invoice.date = getDate(this.invoice.date);
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

				this.oldInvoice.details.forEach((product) => {
					this.$refs.invoiceDetailsTable.addDetail(product);
					// return {
					// 	...product,
					// 	decrementBtn: "primary",
					// 	incrementBtn: "primary",
					// 	instockVariant: "outline-success"
					// };
				});
			}
		},

		watch: {
			"invoice.warehouse": {
				handler(v) {
					if (v) {
						this.invoice.details = [];

						if (this.isPrice) {
							this.getSaleOptions({ warehouse: v });
						} else {
							this.getPurchaseOptions({ warehouse: v });
						}
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

			invoiceId() {
				return this.$route.params.invoiceId;
			},

			isUpdate() {
				return !!this.invoiceId;
			},

			productOptions() {
				let invoiceName = this.isPrice ? "sale" : "purchase";

				return this.$store.getters["Products/options"](invoiceName, this.invoice.warehouse);
			}
		},

		methods: {
			...mapActions({
				getWarehousesOpt: "Warehouses/getOptions",
				getPurchaseOptions: "Products/getPurchaseOptions",
				getSaleOptions: "Products/getSaleOptions",
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
					product: selected._id,
					variant: selected.variantId,
					subUnit: selected.subUnit
				}));

				let action = this.isUpdate ? this.update : this.create;

				try {
					let res = await action(invoice);

					console.log(res);

					// this.$router.push({ name: storeNamespace });
				} catch (err) {
					console.log(err);
				} finally {
					//
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
