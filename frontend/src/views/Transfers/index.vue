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
				<InvoiceButtonFilter :statuses="statuses" :warehouses="warehouseOptions" is-transfer @mounted="filterMounted" @filter="handleFilter" />
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
					<InvoiceActions :invoice="row.item" :namespace="namespace" invoiceName="Transfer" @toTrash="toTrash" @downloadPDF="downloadPDF" noPayments />
				</template>

				<template #cell(index)="row">
					{{ page == 1 ? row.index + 1 : (page - 1) * perPage + row.index + 1 }}
				</template>

				<template #cell(date)="row">
					<DateStr :date="row.value" />
				</template>

				<template #cell(reference)="row">
					<router-link :to="{ name: 'Transfer', params: { id: row.item._id } }" class="d-print-none">
						{{ row.value }}
					</router-link>
					<span class="d-none d-print-block">{{ row.value }}</span>
				</template>

				<template #cell(fromWarehouse)="row">
					<span> {{ row.value | relation }} </span>
				</template>

				<template #cell(toWarehouse)="row">
					<span> {{ row.value | relation }} </span>
				</template>

				<template #cell(total)="row">
					<span class="text-primary font-weight-500">$ {{ row.value | floating }} </span>
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

		<DeleteModal ref="deleteModal" field="Transfer" @ok="moveToTrash" />

		<Transfer v-if="printsControl.item" class="d-none d-print-block" />

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
	</main-content>
</template>

<script>
import dataTableMixin from "@/mixins/dataTableMixin";

import CheckCircleOutlineIcon from "@/components/icons/checkCircleOutline";

import ChangeIcon from "@/components/icons/change";

const DateStr = () => import("@/components/DateStr");

const InvoiceStatus = () => import("@/components/InvoiceStatus");

const Transfer = () => import("@/components/Transfer");

const PrintHeader = () => import("@/components/prints/layout/PrintHeader");

const InvoiceButtonFilter = () => import("@/components/InvoiceButtonFilter");

const DefaultModal = () => import("@/components/DefaultModal");

const InvoiceActions = () => import("@/components/InvoiceActions");

import { mapState } from "vuex";

import { getDate } from "@/helpers";

export default {
	name: "Transfers",

	components: { Transfer, PrintHeader, InvoiceStatus, DateStr, InvoiceButtonFilter, DefaultModal, InvoiceActions, ChangeIcon, CheckCircleOutlineIcon },

	mixins: [dataTableMixin("Transfers")],

	data: () => ({
		namespace: "Transfers",

		breads: [{ title: "Dashboard", link: "/" }, { title: "Transfers" }],

		fields: [
			{ key: "index", label: "#", class: "text-center d-none d-print-table-cell" },
			{ key: "date", label: "Date", sortable: true },
			{ key: "reference", label: "Reference", sortable: true },
			{ key: "fromWarehouse", label: "From Warehouse", sortable: true },
			{ key: "toWarehouse", label: "To Warehouse", sortable: true },
			{ key: "status", label: "Status", sortable: true },
			{ key: "total", label: "Total", sortable: true },
			{ key: "actions", label: "Actions", class: "d-print-none", tdClass: "d-print-none", thClass: "d-print-none" }
		],

		filterationFields: { date: "", reference: "", fromWarehouse: "", toWarehouse: "", status: "" },

		searchIn: { reference: true },

		printsControl: { table: false, item: false },

		excel: {
			fileName: "Transfers",

			columns: [
				{ label: "Date", field: "date", dataFormat: getDate },
				{ label: "Reference", field: "reference" },
				{ label: "Customer", field: "fromWarehouse.name" },
				{ label: "Warehouse", field: "toWarehouse.name" },
				{ label: "Status", field: "status.name" },
				{ label: "Total", field: "total" }
			]
		},

		paymentId: {},

		quantityErrors: []
	}),

	mounted() {
		this.getStatuses();
	},

	computed: {
		...mapState({
			warehouseOptions: (s) => s.Warehouses.options,
			statuses: (s) => s.Transfers.statuses,
			transfer: (s) => s.Transfers.one
		}),

		excelProps() {
			return { ...this.excel, data: this.items };
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
			return this.$store.dispatch("Transfers/getStatuses");
		},

		async filterMounted(finished) {
			await this.$store.dispatch("Warehouses/getOptions");

			finished();
		},

		async changeStatus(item, status) {
			item.status.loading = true;

			try {
				await this.$store.dispatch("Transfers/changeStatus", { invoiceId: item._id, statusId: status._id });

				item.status = Object.assign(item.status, status);

				this.$store.commit("showMessage");
			} catch (e) {
				this.$store.commit("showMessage", { error: true });

				if (e.status == 422 && e.type == "quantity") {
					this.quantityErrors = e.errors;
					this.$bvModal.show("quantityErrors");
				}

				status.selected = false;
			} finally {
				item.status.loading = false;
			}
		},

		// override the default method from dataTableMixin
		btnCreateClicked() {
			this.$router.push({ name: "TransferCreate" });
		},

		async downloadPDF(invoice) {
			await this.$store.dispatch("Transfers/getOne", invoice._id);

			this.hideAllPrints();

			this.printsControl.item = true;

			setTimeout(() => window.print(), 500);
		}
	}
};
</script>
