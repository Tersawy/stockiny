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
			<template #cell(actions)="row">
				<a @click="edit(row.item)" class="text-success">
					<EditIcon />
				</a>

				<a @click="moveToTrash(row.item)" class="text-danger ml-3">
					<TrashIcon />
				</a>
			</template>
		</b-table>

		<TableFooterControls :controls="tableControls" />
	</main-content>
</template>

<script>
	import dataTableMixin from "@/mixins/dataTableMixin";

	export default {
		name: "ExpenseCategories",

		mixins: [dataTableMixin("ExpenseCategories")],

		data: () => ({
			breads: [{ title: "Dashboard", link: "/" }, { title: "Expense Categories" }],

			formId: "expenseCategoryFormModal",

			fields: [
				{ key: "name", label: "Name", sortable: true },
				{ key: "description", label: "Description", sortable: false },
				{ key: "actions", label: "Actions" }
			],

			filterationFields: { name: "", description: "" },

			searchIn: { name: true, description: false }
		})
	};
</script>
