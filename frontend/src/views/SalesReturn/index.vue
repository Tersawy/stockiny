<template>
	<main-content :breads="breads">
		<TableHeaderControls
			:controls="tableControls"
			@btnCreateClicked="btnCreateClicked"
			@btnImportClicked="btnImportClicked"
			@btnExcelClicked="btnExcelClicked"
			@btnPdfClicked="btnPdfClicked"
		/>

		<b-table
			show-empty
			stacked="lg"
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
			class="mb-0"
		>
			<template #cell(actions)="row">
				<InvoiceActions :invoice="row.item" :namespace="namespace" invoiceName="Sale" />
			</template>

			<template #cell(customer)="row">
				<span> {{ row.value | relation }} </span>
			</template>
			<template #cell(warehouse)="row">
				<span> {{ row.value | relation }} </span>
			</template>
			<template #cell(total_price)="row">
				<span class="text-primary font-weight-500">$ {{ row.value | floating }} </span>
			</template>
			<template #cell(paid)="row">
				<span>$ {{ row.value | floating }} </span>
			</template>
			<template #cell(due)="row">
				<span>$ {{ row.value | floating }} </span>
			</template>
			<template #cell(payment_status)="row">
				<span v-payment-status="row.value"> </span>
			</template>
			<template #cell(status)="row">
				<span v-sale-status="row.value"> </span>
			</template>
		</b-table>

		<TableFooterControls :controls="tableControls" />

		<PaymentForm :namespace="namespace" />

		<Payments :namespace="namespace" />
	</main-content>
</template>

<script>
	import dataTableMixin from "@/mixins/dataTableMixin";

	import invoicePaymentsMixin from "@/mixins/invoicePaymentsMixin";

	export default {
		name: "SalesReturn",

		mixins: [dataTableMixin("SalesReturn"), invoicePaymentsMixin],

		data: () => ({
			namespace: "SalesReturn",

			breads: [{ title: "Dashboard", link: "/" }, { title: "Sales return" }],

			fields: [
				{ key: "date", label: "Date", sortable: true },
				{ key: "reference", label: "Reference", sortable: true },
				{ key: "customer", label: "Customer", sortable: true },
				{ key: "warehouse", label: "Warehouse", sortable: true },
				{ key: "status", label: "Status", sortable: true },
				{ key: "total_price", label: "Total", sortable: true },
				{ key: "paid", label: "Paid", sortable: true },
				{ key: "due", label: "Due", sortable: true },
				{ key: "payment_status", label: "Payment Status", sortable: true },
				{ key: "actions", label: "Actions" }
			],

			filterationFields: { date: "", reference: "", customer: "", warehouse: "", status: "", payment_status: "" },

			searchIn: { reference: true, date: false }
		})
	};
</script>
