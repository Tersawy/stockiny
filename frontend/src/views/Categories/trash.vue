<template>
	<main-content :breads="breads">
		<div class="category">Welcome to category page</div>
		<table class="table mt-5">
			<thead>
				<th v-for="header in headers" :key="header">{{ header }}</th>
			</thead>
			<tbody>
				<tr v-for="category in categories" :key="category._id">
					<td>{{ category.code }}</td>
					<td>{{ category.name }}</td>
					<td>{{ category.created_at }}</td>
					<td>
						<b-btn variant="success" @click="restore(category)">restore</b-btn>
						<b-btn variant="danger" @click="remove(category)">delete</b-btn>
					</td>
				</tr>
			</tbody>
		</table>
	</main-content>
</template>

<script>
	import { mapActions, mapState } from "vuex";
	export default {
		name: "CategoriesTrashed",
		data: () => ({
			breads: [{ title: "Dashboard", link: "/" }, { title: "Categories", link: "/categories" }, { title: "Trash" }],
			headers: ["code", "name", "created_at", "actions"]
		}),

		mounted() {
			this.getCategories();
		},

		computed: {
			...mapState({
				categories: (state) => state.Categories.all.docs
			})
		},

		methods: {
			...mapActions({
				getCategories: "Categories/trashed",
				restore: "Categories/restore",
				remove: "Categories/remove"
			})
		}
	};
</script>
