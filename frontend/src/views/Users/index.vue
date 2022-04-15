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
				<b-avatar v-if="row.value" :src="`${BASE_URL}/images/users/${row.value}`" class="shadow-sm" rounded="lg"></b-avatar>
			</template>

			<template #cell(email)="row">
				<a :href="`mailto:${row.value}`">{{ row.value }}</a>
			</template>

			<template #cell(phone)="row">
				<a :href="`tel:+${row.value}`"> {{ row.value }} </a>
			</template>

			<template #cell(isActive)="row">
				<b-form-checkbox v-model="row.item.isActive" @change="changeStatus(row.item)" switch :disabled="!hasPermission('active:users')" />
			</template>

			<template #cell(actions)="row">
				<router-link :to="{ name: 'UserEdit', params: { userId: row.item._id } }" class="text-success mx-3">
					<EditIcon />
				</router-link>

				<a @click="moveToTrash(row.item)" class="text-danger">
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
		name: "Users",

		mixins: [dataTableMixin("Users")],

		data: () => ({
			breads: [{ title: "Dashboard", link: "/" }, { title: "Users" }],

			fields: [
				{ key: "image", label: "Image", sortable: true },
				{ key: "username", label: "Username", sortable: true },
				{ key: "role.name", label: "Role", sortable: true },
				{ key: "phone", label: "Phone", sortable: true },
				{ key: "email", label: "Email", sortable: true },
				{ key: "country", label: "Country", sortable: true },
				{ key: "city", label: "City", sortable: true },
				{ key: "address", label: "Address", sortable: true },
				{ key: "zipCode", label: "Zip Code", sortable: true },
				{ key: "isActive", label: "Active", sortable: true },
				{ key: "actions", label: "Actions" }
			],

			filterationFields: { name: "", phone: "", email: "", country: "", city: "", address: "", zipCode: "" },

			searchIn: { name: true, phone: false, email: false, country: false, city: false, address: false, zipCode: false }
		}),

		methods: {
			// override the default method from dataTableMixin
			btnCreateClicked() {
				this.$router.push({ name: "UserCreate" });
			},

			async changeStatus(item) {
				try {
					let data = await this.$store.dispatch("Users/changeActivation", item._id);

					item.isActive = data.isActive;

					let message = data.isActive ? "actions.active" : "actions.inactive";

					message = this.$t(message, { module: item.username });

					this.$store.commit("showToast", message);
				} catch (error) {
					console.log(error);
				}
			}
		}
	};
</script>
