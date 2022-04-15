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
			<template #cell(image)="row">
				<b-avatar v-if="row.value" :src="`${BASE_URL}/images/products/${row.item._id}/${row.value}`" class="shadow-sm" rounded="lg"></b-avatar>
			</template>

			<template #cell(price)="row">
				<span>$ {{ row.value | floating }} </span>
			</template>

			<template #cell(instock)="row">
				<b-badge variant="outline-success"> {{ row.value | floating }} {{ row.item.unit.shortName }} </b-badge>
			</template>

			<template #cell(actions)="row">
				<div class="d-flex align-items-center">
					<router-link :to="{ name: 'Product', params: { productId: row.item._id } }">
						<ShowIcon />
					</router-link>

					<router-link :to="{ name: 'ProductEdit', params: { productId: row.item._id } }" class="text-success mx-3">
						<EditIcon />
					</router-link>

					<a @click="moveToTrash(row.item)" class="text-danger">
						<TrashIcon />
					</a>
				</div>
			</template>
		</b-table>

		<TableFooterControls :controls="tableControls" />
	</main-content>
</template>

<script>
	import dataTableMixin from "@/mixins/dataTableMixin";

	import ShowIcon from "@/components/icons/show";

	export default {
		name: "Products",

		mixins: [dataTableMixin("Products")],

		components: { ShowIcon },

		data: () => ({
			breads: [{ title: "Dashboard", link: "/" }, { title: "Products" }],

			fields: [
				{ key: "image", label: "Image", sortable: false },
				{ key: "name", label: "Name", sortable: true },
				{ key: "code", label: "Code", sortable: true },
				{ key: "category.name", label: "Category", sortable: false },
				{ key: "brand.name", label: "Brand", sortable: false },
				{ key: "price", label: "Price", sortable: true },
				{ key: "unit.name", label: "Unit", sortable: false },
				{ key: "instock", label: "Stock", sortable: true },
				{ key: "actions", label: "Actions" }
			],

			filterationFields: { name: "", code: "", category: "", brand: "" },

			searchIn: { code: true, name: true }
		}),

		methods: {
			// override the default method from dataTableMixin
			btnCreateClicked() {
				this.$router.push({ name: "ProductCreate" });
			}
		}
	};
	/*
		Code 128 	=> 8
		Code 39 	=> 8
		EAN8 			=> 7
		EAN13 		=> 12
		UPC 			=> 11
	*/
</script>
