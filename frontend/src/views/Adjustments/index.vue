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
				<InvoiceButtonFilter :statuses="statuses" :warehouses="warehouseOptions" @mounted="filterMounted" @filter="handleFilter" noPayment />
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
					<InvoiceActions :invoice="row.item" :namespace="namespace" invoiceName="Adjustment" @toTrash="toTrash" @downloadPDF="downloadPDF" noPayments noEmail />
				</template>

				<template #cell(index)="row">
					{{ page == 1 ? row.index + 1 : (page - 1) * perPage + row.index + 1 }}
				</template>

				<template #cell(date)="row">
					<DateStr :date="row.value" />
				</template>

				<template #cell(reference)="row">
					<router-link :to="{ name: 'Adjustment', params: { id: row.item._id } }" class="d-print-none">
						{{ row.value }}
					</router-link>
					<span class="d-none d-print-block">{{ row.value }}</span>
				</template>

				<template #cell(warehouse)="row">
					<span> {{ row.value | relation }} </span>
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

		<DeleteModal ref="deleteModal" field="Adjustment" @ok="moveToTrash" />

		<div class="d-none d-print-block">
			<Adjustment v-if="printsControl.item" />
		</div>

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
import dataTableMixin from "@/mixins/dataTableMixin";

import CheckCircleOutlineIcon from "@/components/icons/checkCircleOutline";

import ChangeIcon from "@/components/icons/change";

const DateStr = () => import("@/components/DateStr");

const InvoiceStatus = () => import("@/components/InvoiceStatus");

const Adjustment = () => import("@/components/Adjustment");

const PrintHeader = () => import("@/components/prints/layout/PrintHeader");

const InvoiceButtonFilter = () => import("@/components/InvoiceButtonFilter");

const DefaultModal = () => import("@/components/DefaultModal");

const InvoiceActions = () => import("@/components/InvoiceActions");

import { mapState } from "vuex";

import { getDate } from "@/helpers";

import { showMessage } from "@/components/utils";

export default {
	name: "Adjustments",

	components: { Adjustment, PrintHeader, InvoiceStatus, DateStr, InvoiceButtonFilter, DefaultModal, InvoiceActions, ChangeIcon, CheckCircleOutlineIcon },

	mixins: [dataTableMixin("Adjustments")],

	data: () => ({
		namespace: "Adjustments",

		breads: [{ title: "Dashboard", link: "/" }, { title: "Adjustments" }],

		fields: [
			{ key: "index", label: "#", class: "text-center d-none d-print-table-cell" },
			{ key: "date", label: "Date", sortable: true },
			{ key: "reference", label: "Reference", sortable: true },
			{ key: "warehouse", label: "Warehouse", sortable: true },
			{ key: "status", label: "Status", sortable: true },
			{ key: "actions", label: "Actions", class: "d-print-none", tdClass: "d-print-none", thClass: "d-print-none" }
		],

		filterationFields: { date: "", reference: "", warehouse: "", status: "" },

		searchIn: { reference: true, date: false },

		printsControl: { table: false, item: false },

		excel: {
			fileName: "Adjustments",

			columns: [
				{ label: "Date", field: "date", dataFormat: getDate },
				{ label: "Reference", field: "reference" },
				{ label: "Warehouse", field: "warehouse.name" },
				{ label: "Status", field: "status.name" }
			]
		},

		quantityErrors: {
			tableFields: [
				{ key: "productName", label: "Product" },
				{ key: "stockBefore", label: "Stock Before" },
				{ key: "stockAfter", label: "Stock After" }
			],
			errors: []
		}
	}),

	mounted() {
		this.getStatuses();
	},

	computed: {
		...mapState({
			warehouseOptions: (s) => s.Warehouses.options,
			statuses: (s) => s.Adjustments.statuses,
			adjustment: (s) => s.Adjustments.one
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
			return this.$store.dispatch("Adjustments/getStatuses");
		},

		async filterMounted(finished) {
			try {
				await this.$store.dispatch("Warehouses/getOptions");
			} finally {
				finished();
			}
		},

		async changeStatus(item, status) {
			item.status.loading = true;

			try {
				await this.$store.dispatch("Adjustments/changeStatus", { invoiceId: item._id, statusId: status._id });

				item.status = Object.assign(item.status, status);

				this.$store.commit("showMessage");
			} catch (e) {
				this.$store.commit("showMessage", { error: true });

				if (e.status == 422 && e.type == "quantity") {
					this.quantityErrors.errors = e.errors;
					this.$bvModal.show("quantityErrors");
				}

				status.selected = false;
			} finally {
				item.status.loading = false;
			}
		},

		async moveToTrash(adjustment) {
			try {
				this.$refs.deleteModal.setBusy(true);

				await this.$store.dispatch("Adjustments/moveToTrash", adjustment);

				showMessage({ message: this.$t("messages.deleted") });
			} catch (e) {
				if (e.status == 400) {
					showMessage({ error: true, message: this.$t(`messages.${e.message}`) });
					if (e.message == "effected") {
						adjustment.statuses.forEach((status) => {
							status.selected = false;
							if (status.effected) {
								status.selected = true;
								adjustment.status = status;
							}
						});
					}
				} else if (e.status == 404) {
					this.$store.commit("Adjustments/remove", adjustment._id);
					showMessage({ message: this.$t("messages.deleted") });
				} else {
					showMessage({ error: true });
				}
			} finally {
				this.$refs.deleteModal.close();
			}
		},

		// override the default method from dataTableMixin
		btnCreateClicked() {
			this.$router.push({ name: "AdjustmentCreate" });
		},

		async downloadPDF(invoice) {
			await this.$store.dispatch("Adjustments/getOne", invoice._id);

			this.hideAllPrints();

			this.printsControl.item = true;

			setTimeout(() => window.print(), 500);
		}
	}
};
</script>
