<template>
	<main-content :breads="breads">
		<div class="warehouse">Welcome to warehouse page</div>
		<table class="table mt-5">
			<thead>
				<th v-for="header in headers" :key="header">{{ header }}</th>
			</thead>
			<tbody>
				<tr v-for="warehouse in warehouses" :key="warehouse._id">
					<td>{{ warehouse.name }}</td>
					<td>{{ warehouse.city }}</td>
					<td>{{ warehouse.country }}</td>
					<td>{{ warehouse.email }}</td>
					<td>{{ warehouse.phone }}</td>
					<td>{{ warehouse.zip_code }}</td>
					<td>{{ warehouse.created_at }}</td>
					<td>{{ warehouse.deleted }}</td>
					<td>
						<b-btn variant="success" @click="restore(warehouse)">restore</b-btn>
						<b-btn variant="danger" @click="remove(warehouse)">delete</b-btn>
					</td>
				</tr>
			</tbody>
		</table>
	</main-content>
</template>

<script>
	import { mapActions, mapState } from "vuex";
	export default {
		name: "WarehousesTrashed",
		data: () => ({
			breads: [{ title: "Dashboard", link: "/" }, { title: "Warehouses", link: "/warehouses" }, { title: "Trash" }],
			headers: ["name", "city", "country", "email", "phone", "zip_code", "created_at", "deleted", "actions"]
		}),

		mounted() {
			this.getWarehouses();
		},

		computed: {
			...mapState({
				warehouses: (state) => state.Warehouses.all.docs
			})
		},

		methods: {
			...mapActions({
				getWarehouses: "Warehouses/trashed",
				restore: "Warehouses/restore",
				remove: "Warehouses/remove"
			})
		}
	};
</script>
