<template>
	<main-content :breads="breads">
		<TableHeaderControls
			:controls="tableControls"
			@btnCreateClicked="btnCreateClicked"
			@btnImportClicked="btnImportClicked"
			@btnExcelClicked="btnExcelClicked"
			@btnPdfClicked="btnPdfClicked"
		/>
		<div style="overflow-x: auto" class="border-right border-left">
			<b-table
				show-empty
				stacked="md"
				hover
				sort-icon-left
				:busy="tableIsBusy"
				:items="items"
				:fields="fields"
				:current-page="1"
				:per-page="perPage"
				:sort-by.sync="sortBy"
				:sort-desc.sync="sortDesc"
				@context-changed="contextChanged"
				:filter="search"
				:filter-function="() => items"
				class="mb-0 text-nowrap"
			>
				<template #cell(actions)="row">
					<InvoiceActions :invoice="row.item" :namespace="namespace" invoiceName="Purchase" />
				</template>

				<template #cell(index)="row">
					{{ page == 1 ? row.index + 1 : (page - 1) * perPage + row.index + 1 }}
				</template>

				<template #cell(date)="row">
					<DateStr :date="row.value" />
				</template>

				<template #cell(reference)="row">
					<router-link :to="{ name: 'Purchase', params: { id: row.item._id } }" class="d-print-none">
						{{ row.value }}
					</router-link>
					<span class="d-none d-print-block">{{ row.value }}</span>
				</template>

				<template #cell(supplier)="row">
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
							class="d-print-none"
						>
							<template #button-content>
								<ChangeIcon scale="1" v-b-tooltip title="Change Status" />
							</template>
							<b-overlay :show="item.status.loading" spinner-variant="secondary" spinner-small>
								<div class="d-flex justify-content-between px-3 py-2 border-bottom" v-for="statusOption in statuses" :key="statusOption._id">
									<div class="d-flex align-items-center">
										<InvoiceStatus :status="statusOption" />
										<CheckCircleOutlineIcon v-if="statusOption.effected" scale="0.7" class="ml-1" />
									</div>
									<b-form-checkbox
										switch
										class="ml-4"
										:disabled="item.status._id == statusOption._id"
										v-model="status(item.status, statusOption).effected"
										@change="changeStatus(item, statusOption)"
									></b-form-checkbox>
								</div>
							</b-overlay>
						</b-dropdown>
					</div>
				</template>
			</b-table>
		</div>

		<TableFooterControls :controls="tableControls" />

		<PaymentForm :namespace="namespace" />

		<Payments :namespace="namespace" />
	</main-content>
</template>

<script>
import dataTableMixin from "@/mixins/dataTableMixin";

import invoicePaymentsMixin from "@/mixins/invoicePaymentsMixin";

import CheckCircleOutlineIcon from "@/components/icons/checkCircleOutline";

import ChangeIcon from "@/components/icons/change";

const DateStr = () => import("@/components/DateStr");

const InvoiceStatus = () => import("@/components/ui/InvoiceStatus");

export default {
	name: "Purchases",

	components: { InvoiceStatus, DateStr, ChangeIcon, CheckCircleOutlineIcon },

	mixins: [dataTableMixin("Purchases"), invoicePaymentsMixin],

	data: () => ({
		namespace: "Purchases",

		components: { InvoiceStatus },

		breads: [{ title: "Dashboard", link: "/" }, { title: "Purchases" }],

		fields: [
			{ key: "index", label: "#", class: "text-center d-none d-print-table-cell" },
			{ key: "date", label: "Date", sortable: true },
			{ key: "reference", label: "Reference", sortable: true },
			{ key: "supplier", label: "Supplier", sortable: true },
			{ key: "warehouse", label: "Warehouse", sortable: true },
			{ key: "status", label: "Status", sortable: true },
			{ key: "total", label: "Total", sortable: true },
			{ key: "paid", label: "Paid", sortable: true },
			{ key: "due", label: "Due", sortable: true },
			{ key: "paymentStatus", label: "Payment Status", sortable: true },
			{ key: "actions", label: "Actions", class: "d-print-none", tdClass: "d-print-none", thClass: "d-print-none" }
		],
		filterationFields: { date: "", reference: "", supplier: "", warehouse: "", status: "", paymentStatus: "" },
		searchIn: { reference: true, date: false }
	}),

	async mounted() {
		await this.getStatuses();
	},

	computed: {
		statuses() {
			return this.$store.state.Purchases.statuses;
		}
	},

	methods: {
		getStatuses() {
			return this.$store.dispatch("Purchases/getStatuses");
		},

		status(status, statusOption) {
			return { effected: status._id == statusOption._id };
		},

		async changeStatus(item, statusOption) {
			item.status.loading = true;

			try {
				await this.$store.dispatch("Purchases/changeStatus", { invoiceId: item._id, statusId: statusOption._id });

				item.status = { ...statusOption, loading: false };

				this.$store.commit("showMessage");
			} catch (e) {
				this.$store.commit("showMessage", { error: true });
			} finally {
				item.status.loading = false;
			}
		},

		// override the default method from dataTableMixin
		btnCreateClicked() {
			this.$router.push({ name: "PurchaseCreate" });
		},

		due(invoice) {
			return +invoice.total - +invoice.paid || 0;
		}
	}
};
</script>
