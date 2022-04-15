<template>
	<div>
		<div class="supplier">Welcome to supplier page</div>
		<table class="table mt-5">
			<thead>
				<th v-for="header in headers" :key="header">{{ header }}</th>
			</thead>
			<tbody>
				<tr v-for="supplier in suppliers" :key="supplier._id">
					<td>{{ supplier.name }}</td>
					<td>{{ supplier.city }}</td>
					<td>{{ supplier.country }}</td>
					<td>{{ supplier.email }}</td>
					<td>{{ supplier.phone }}</td>
					<td>{{ supplier.address }}</td>
					<td>
						<b-btn variant="success" @click="restore(supplier)">restore</b-btn>
						<b-btn variant="danger" @click="remove(supplier)">delete</b-btn>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<script>
	import { mapActions, mapState } from "vuex";
	export default {
		name: "SuppliersTrashed",
		data: () => ({
			headers: ["name", "city", "country", "email", "phone", "address", "actions"]
		}),

		mounted() {
			this.getSuppliers();
		},

		computed: {
			...mapState({
				suppliers: (state) => state.Suppliers.all.docs
			})
		},

		methods: {
			...mapActions({
				getSuppliers: "Suppliers/trashed",
				restore: "Suppliers/restore",
				remove: "Suppliers/remove"
			})
		}
	};
</script>
