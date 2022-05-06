<template>
	<main-content :breads="breads">
		<TableHeaderControls
			:controls="tableControls"
			@btnCreateClicked="btnCreateClicked"
			@btnImportClicked="btnImportClicked"
			@btnExcelClicked="btnExcelClicked"
			@btnPdfClicked="btnPdfClicked"
		/>

		<div style="overflow-x: auto" class="text-nowrap">
			<b-table
				show-empty
				stacked="md"
				responsive
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
				<template #cell(index)="row">
					{{ page == 1 ? row.index + 1 : (page - 1) * perPage + row.index + 1 }}
				</template>

				<template #cell(date)="row">
					<span>{{ row.value && new Date(row.value).toDateString() }}</span>
				</template>

				<template #cell(actions)="row">
					<a @click="edit(row.item)" class="text-success">
						<EditIcon />
					</a>

					<a @click="moveToTrash(row.item)" class="text-danger ml-3">
						<TrashIcon />
					</a>
				</template>
			</b-table>
		</div>

		<TableFooterControls :controls="tableControls" />
	</main-content>
</template>

<script>
import dataTableMixin from "@/mixins/dataTableMixin";

export default {
	name: "Expenses",

	mixins: [dataTableMixin("Expenses")],

	data: () => ({
		breads: [{ title: "Dashboard", link: "/" }, { title: "Expenses" }],

		formId: "expenseFormModal",

		fields: [
			{ key: "index", label: "#", class: "text-center d-none d-print-table-cell" },
			{ key: "reference", label: "Reference", sortable: true },
			{ key: "amount", label: "Amount", sortable: true },
			{ key: "date", label: "Date", sortable: true },
			{ key: "category.name", label: "Category", sortable: false, formatter: (v) => v || "- - -" },
			{ key: "warehouse.name", label: "Warehouse", sortable: false, formatter: (v) => v || "- - -" },
			{ key: "details", label: "Details", sortable: false, formatter: (v) => v || "- - -" },
			{ key: "actions", label: "Actions", class: "d-print-none" }
		],

		filterationFields: { reference: "", amount: "", date: "", category: "", warehouse: "", details: "" },

		searchIn: { reference: true, date: false, details: false }
	})
};
</script>
