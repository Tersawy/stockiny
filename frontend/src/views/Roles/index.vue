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

				<template #cell(createdAt)="row">
					<span>{{ row.value | date }}</span>
				</template>

				<template #cell(updatedAt)="row">
					<span>{{ row.value | date }}</span>
				</template>

				<template #cell(actions)="row">
					<router-link :to="{ name: 'RoleEdit', params: { roleId: row.item._id } }" class="text-success mr-3">
						<EditIcon />
					</router-link>

					<a @click="toTrash(row.item)" class="text-danger">
						<TrashIcon />
					</a>
				</template>
			</b-table>
		</div>

		<DeleteModal ref="deleteModal" field="Role" @ok="moveToTrash" />

		<TableFooterControls :controls="tableControls" />
	</main-content>
</template>

<script>
import dataTableMixin from "@/mixins/dataTableMixin";

export default {
	name: "Roles",

	mixins: [dataTableMixin("Roles")],

	data: () => ({
		breads: [{ title: "Dashboard", link: "/" }, { title: "Roles" }],

		fields: [
			{ key: "index", label: "#", class: "text-center d-none d-print-table-cell" },
			{ key: "name", label: "Name", sortable: true },
			{ key: "createdAt", label: "Created At", sortable: true, formatter: "date" },
			{ key: "createdBy.username", label: "Created By", sortable: false, formatter: (v) => v || "- - -" },
			{ key: "updatedAt", label: "Updated At", sortable: true, formatter: "date" },
			{ key: "updatedBy.username", label: "Updated By", sortable: false, formatter: (v) => v || "- - -" },
			{ key: "actions", label: "Actions", class: "d-print-none" }
		],

		filterationFields: { name: "" },

		searchIn: { name: true }
	}),

	methods: {
		// override the default method from dataTableMixin
		btnCreateClicked() {
			this.$router.push({ name: "RoleCreate" });
		}
	}
};
</script>
