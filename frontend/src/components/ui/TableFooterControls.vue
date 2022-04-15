<template>
	<b-row class="pt-3">
		<b-col sm="6" md="6" lg="4">
			<div class="d-flex align-items-center justify-content-center justify-content-sm-start">
				<b-card body-class="d-flex align-items-center py-0 px-3" class="rounded-pill">
					<span class="text-muted">Rows per page: </span>
					<b-form-group class="mb-0">
						<b-form-select v-model="controls.perPage" :options="controls.perPageOptions" class="bg-transparent border-0 shadow-none"></b-form-select>
					</b-form-group>
				</b-card>
			</div>
		</b-col>
		<b-col sm="6" md="6" lg="4" class="ml-auto" order="first" order-sm="last">
			<b-pagination v-model="controls.page" :total-rows="controls.docsCount" :per-page="controls.perPage" align="fill" size="md" class="pagination" pills></b-pagination>
		</b-col>
	</b-row>
</template>

<script>
	export default {
		props: {
			controls: {
				type: Object,
				default: () => ({
					page: 1,
					perPage: 10,
					perPageOptions: [10, 20, 30, 40, 50],
					docsCount: 0
				})
			}
		}
	};
</script>
