<template>
	<main-content :breads="breads">
		<div class="brand">Welcome to brand page</div>
		<table class="table mt-5">
			<thead>
				<th v-for="header in headers" :key="header">{{ header }}</th>
			</thead>
			<tbody>
				<tr v-for="brand in categories" :key="brand._id">
					<td>{{ brand.image }}</td>
					<td>{{ brand.name }}</td>
					<td>{{ brand.description }}</td>
					<td>{{ brand.created_at }}</td>
					<td>
						<b-btn variant="success" @click="restore(brand)">restore</b-btn>
						<b-btn variant="danger" @click="remove(brand)">delete</b-btn>
					</td>
				</tr>
			</tbody>
		</table>
	</main-content>
</template>

<script>
	import { mapActions, mapState } from "vuex";
	export default {
		name: "BrandsTrashed",
		data: () => ({
			breads: [{ title: "Dashboard", link: "/" }, { title: "Brands", link: "/brands" }, { title: "Trash" }],
			headers: ["image", "name", "description", "created_at", "actions"]
		}),

		mounted() {
			this.getBrands();
		},

		computed: {
			...mapState({
				categories: (state) => state.Brands.all.docs
			})
		},

		methods: {
			...mapActions({
				getBrands: "Brands/trashed",
				restore: "Brands/restore",
				remove: "Brands/remove"
			})
		}
	};
</script>
