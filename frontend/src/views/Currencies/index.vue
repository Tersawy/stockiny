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

				<template #cell(actions)="row">
					<a @click="edit(row.item)" class="text-success">
						<EditIcon />
					</a>

					<a @click="toTrash(row.item)" class="text-danger ml-3">
						<TrashIcon />
					</a>
				</template>
			</b-table>
		</div>

		<DeleteModal ref="deleteModal" field="Currency" @ok="moveToTrash" />

		<TableFooterControls :controls="tableControls" />
	</main-content>
</template>

<script>
import dataTableMixin from "@/mixins/dataTableMixin";

export default {
	name: "Currencies",

	mixins: [dataTableMixin("Currencies")],

	data: () => ({
		breads: [{ title: "Dashboard", link: "/" }, { title: "Currencies" }],

		formId: "currencyFormModal",

		fields: [
			{ key: "index", label: "#", class: "text-center d-none d-print-table-cell" },
			{ key: "code", label: "Currency Code", sortable: true },
			{ key: "name", label: "Currency Name", sortable: true },
			{ key: "symbol", label: "Symbol", sortable: true },
			{ key: "actions", label: "Actions", class: "d-print-none" }
		],

		filterationFields: { name: "", code: "", symbol: "" },

		searchIn: { name: true, code: false, symbol: false }
	})
};
</script>
