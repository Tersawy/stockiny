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
	name: "Customers",

	mixins: [dataTableMixin("Customers")],

	data: () => ({
		breads: [{ title: "Dashboard", link: "/" }, { title: "Customers" }],

		formId: "customerFormModal",

		fields: [
			{ key: "index", label: "#", class: "text-center d-none d-print-table-cell" },
			{ key: "name", label: "Name", sortable: true },
			{ key: "phone", label: "Phone", sortable: true },
			{ key: "email", label: "Email", sortable: true },
			{ key: "country", label: "Country", sortable: true },
			{ key: "city", label: "City", sortable: true },
			{ key: "address", label: "Address", sortable: true },
			{ key: "zipCode", label: "Zip Code", sortable: true },
			{ key: "actions", label: "Actions", class: "d-print-none" }
		],

		filterationFields: { name: "", phone: "", email: "", country: "", city: "", address: "", zipCode: "" },

		searchIn: { name: true, phone: false, email: false, country: false, city: false, address: false, zipCode: false }
	})
};
</script>
