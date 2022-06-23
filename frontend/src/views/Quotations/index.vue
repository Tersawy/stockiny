<template>
	<main-content :breads="breads">
		<table-header-controls
			:controls="tableControls"
			@btnCreateClicked="btnCreateClicked"
			@btnImportClicked="btnImportClicked"
			@btnExcelClicked="btnExcelClicked"
			@btnPdfClicked="btnPdfClicked"
			inputSeachPlaceholder="Search by reference"
			noImport
			:excelProps="excelProps"
		>
			<template #button-search-in>
				<InvoiceButtonFilter :statuses="statuses" :warehouses="warehouseOptions" :customers="customerOptions" @mounted="filterMounted" @filter="handleFilter" />
			</template>
		</table-header-controls>

		<div class="d-none d-print-block w-100" v-if="!printsControl.item">
			<PrintHeader />
		</div>

		<div style="overflow-x: auto" :class="`text-nowrap ${printsControl.table ? '' : 'd-print-none'}`">
			<b-table
				show-empty
				stacked="md"
				hover
				sort-icon-left
				:busy="tableIsBusy"
				:items="invoices"
				:fields="fields"
				:current-page="1"
				:per-page="perPage"
				:sort-by.sync="sortBy"
				:sort-desc.sync="sortDesc"
				@context-changed="contextChanged"
				:filter="search"
				:filter-function="() => invoices"
				class="mb-0 text-nowrap"
			>
				<template #cell(actions)="row">
					<invoice-actions
						:invoice="row.item"
						:namespace="namespace"
						invoice-name="Quotation"
						@toTrash="toTrash"
						@downloadPDF="downloadPDF"
						@downloadPaymentsPDF="printPayments"
					>
						<b-dropdown-item link-class="p-0">
							<router-link :to="{ name: `SaleCreate`, query: { quotationId: row.item._id } }" class="py-2 px-4 d-flex align-items-center text-decoration-none">
								<b-icon icon="pencil-square" scale="0.8"></b-icon>
								<span class="mx-2 text-muted">Make It Sale</span>
							</router-link>
						</b-dropdown-item>
					</invoice-actions>
				</template>

				<template #cell(index)="row">
					{{ page == 1 ? row.index + 1 : (page - 1) * perPage + row.index + 1 }}
				</template>

				<template #cell(date)="row">
					<DateStr :date="row.value" />
				</template>

				<template #cell(reference)="row">
					<router-link :to="{ name: 'Quotation', params: { id: row.item._id } }" class="d-print-none">
						{{ row.value }}
					</router-link>
					<span class="d-none d-print-block">{{ row.value }}</span>
				</template>

				<template #cell(customer)="row">
					<span> {{ row.value | relation }} </span>
				</template>

				<template #cell(warehouse)="row">
					<span> {{ row.value | relation }} </span>
				</template>

				<template #cell(total)="row">
					<span class="text-primary font-weight-500">$ {{ row.value | floating }} </span>
				</template>

				<template #cell(paid)="row">
					<span>$ {{ row.value | floating }} </span>
				</template>

				<template #cell(due)="{ item }">
					<span>$ {{ due(item) | floating }} </span>
				</template>

				<template #cell(paymentStatus)="row">
					<span v-payment-status="row.value"> </span>
				</template>

				<template #cell(status)="{ item }">
					<div class="w-100 d-flex justify-content-lg-between align-items-center">
						<InvoiceStatus :status="item.status" />

						<b-dropdown
							right
							variant="outline-danger"
							size="sm"
							toggle-class="text-decoration-none px-1 ml-4 ml-lg-2"
							:toggle-attrs="{ style: 'padding-top:2px;padding-bottom:2px;' }"
							no-caret
							menu-class="py-0 shadow-sm"
							class="d-print-none position-unset"
						>
							<template #button-content>
								<ChangeIcon scale="1" v-b-tooltip title="Change Status" />
							</template>
							<b-overlay :show="item.status.loading" spinner-variant="secondary" spinner-small>
								<div class="d-flex justify-content-between px-3 py-2 border-bottom" v-for="status in item.statuses" :key="status._id">
									<div class="d-flex align-items-center">
										<InvoiceStatus :status="status" />
										<CheckCircleOutlineIcon v-if="status.effected" scale="0.7" class="ml-1" />
									</div>
									<b-form-checkbox switch class="ml-4" :disabled="status.selected" v-model="status.selected" @change="changeStatus(item, status)"></b-form-checkbox>
								</div>
							</b-overlay>
						</b-dropdown>
					</div>
				</template>
			</b-table>
		</div>

		<TableFooterControls :controls="tableControls" />

		<PaymentForm :namespace="namespace" />

		<Payments :namespace="namespace" @print="printPayment" />

		<DeleteModal ref="deleteModal" field="Quotation" @ok="moveToTrash" />

		<div class="d-none d-print-block">
			<Quotation v-if="printsControl.item" with-payments />

			<template v-if="printsControl.payment">
				<QuotationPayment :paymentId="paymentId" />
			</template>
		</div>
	</main-content>
</template>

<script>
import dataTableMixin from "@/mixins/dataTableMixin";

import invoicePaymentsMixin from "@/mixins/invoicePaymentsMixin";

import CheckCircleOutlineIcon from "@/components/icons/checkCircleOutline";

import ChangeIcon from "@/components/icons/change";

const DateStr = () => import("@/components/DateStr");

const InvoiceStatus = () => import("@/components/InvoiceStatus");

const Quotation = () => import("@/components/Quotation");

const QuotationPayment = () => import("@/components/prints/QuotationPayment");

const PrintHeader = () => import("@/components/prints/layout/PrintHeader");

const InvoiceButtonFilter = () => import("@/components/InvoiceButtonFilter");

import { mapState } from "vuex";

import { getDate } from "@/helpers";

export default {
	name: "Quotations",

	components: { Quotation, QuotationPayment, PrintHeader, InvoiceStatus, DateStr, InvoiceButtonFilter, ChangeIcon, CheckCircleOutlineIcon },

	mixins: [dataTableMixin("Quotations"), invoicePaymentsMixin],

	data: () => ({
		namespace: "Quotations",

		breads: [{ title: "Dashboard", link: "/" }, { title: "Quotations" }],

		fields: [
			{ key: "index", label: "#", class: "text-center d-none d-print-table-cell" },
			{ key: "date", label: "Date", sortable: true },
			{ key: "reference", label: "Reference", sortable: true },
			{ key: "customer", label: "Customer", sortable: true },
			{ key: "warehouse", label: "Warehouse", sortable: true },
			{ key: "status", label: "Status", sortable: true },
			{ key: "total", label: "Total", sortable: true },
			{ key: "paid", label: "Paid", sortable: true },
			{ key: "due", label: "Due", sortable: true },
			{ key: "paymentStatus", label: "Payment Status", sortable: true },
			{ key: "actions", label: "Actions", class: "d-print-none", tdClass: "d-print-none", thClass: "d-print-none" }
		],

		filterationFields: { date: "", reference: "", customer: "", warehouse: "", status: "", paymentStatus: "" },

		searchIn: { reference: true, date: false },

		printsControl: { table: false, item: false, payment: false },

		excel: {
			fileName: "Quotations",

			columns: [
				{ label: "Date", field: "date", dataFormat: getDate },
				{ label: "Reference", field: "reference" },
				{ label: "Customer", field: "customer.name" },
				{ label: "Warehouse", field: "warehouse.name" },
				{ label: "Status", field: "status.name" },
				{ label: "Total", field: "total" },
				{ label: "Paid", field: "paid" },
				{ label: "Due", field: "due" },
				{ label: "Payment Status", field: "paymentStatus" }
			]
		},

		paymentId: {}
	}),

	mounted() {
		this.getStatuses();
	},

	computed: {
		...mapState({
			warehouseOptions: (s) => s.Warehouses.options,
			customerOptions: (s) => s.Customers.options,
			statuses: (s) => s.Sales.statuses,
			quotation: (s) => s.Quotations.one
		}),

		excelProps() {
			return {
				...this.excel,
				data: this.items.map((item) => ({ ...item, due: +item.total - (+item.paid || 0) }))
			};
		},

		invoices() {
			return this.items.map((item) => {
				item.statuses = this.statuses.map((status) => ({ ...status, selected: item.status._id == status._id, loading: false }));

				return item;
			});
		}
	},

	methods: {
		getStatuses() {
			return this.$store.dispatch("Sales/getStatuses");
		},

		async filterMounted(finished) {
			let customers = this.$store.dispatch("Customers/getOptions");

			let warehouses = this.$store.dispatch("Warehouses/getOptions");

			try {
				await Promise.all([customers, warehouses]);
			} finally {
				finished();
			}
		},

		async changeStatus(item, status) {
			item.status.loading = true;

			try {
				await this.$store.dispatch("Quotations/changeStatus", { invoiceId: item._id, statusId: status._id });

				item.status = Object.assign(item.status, status);

				this.$store.commit("showMessage");
			} catch (e) {
				this.$store.commit("showMessage", { error: true });

				status.selected = false;
			} finally {
				item.status.loading = false;
			}
		},

		// override the default method from dataTableMixin
		btnCreateClicked() {
			this.$router.push({ name: "QuotationCreate" });
		},

		due(invoice) {
			return +invoice.total - +invoice.paid || 0;
		},

		async downloadPDF(invoice) {
			await this.$store.dispatch("Quotations/getOne", invoice._id);

			this.hideAllPrints();

			this.printsControl.item = true;

			setTimeout(() => window.print(), 500);
		},

		async printPayment(payment) {
			if (this.quotation) {
				let res = { payments: this.quotation.payments || [], invoiceId: this.quotation._id };

				await this.$store.dispatch("Quotations/getOne", this.quotation._id);

				this.$store.commit("Quotations/payments", res);
			}

			this.hideAllPrints();

			this.paymentId = payment._id;

			this.printsControl.payment = true;

			setTimeout(() => window.print(), 500);
		},

		async printPayments(quotation) {
			this.$store.commit("Quotations/setOne", quotation);

			let getOne = this.$store.dispatch("Quotations/getOne", this.quotation._id);

			let getPayments = this.$store.dispatch("Quotations/getPayments");

			await Promise.all([getOne, getPayments]);

			this.hideAllPrints();

			this.paymentId = null;

			this.printsControl.payment = true;

			setTimeout(() => window.print(), 500);
		}
	}
};
</script>
