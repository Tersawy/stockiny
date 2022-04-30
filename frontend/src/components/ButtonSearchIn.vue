<template>
	<b-input-group-append>
		<b-btn variant="primary" class="position-relative">
			<FilterIcon />
			<span class="d-none d-sm-inline ml-1">Search In</span>

			<b-dropdown
				variant="link"
				class="position-absolute w-100 d-flex h-100"
				style="left: 0; top: 0"
				toggle-class="text-decoration-none p-0"
				no-caret
				menu-class="custom-menu"
				right
			>
				<template #button-content> </template>
				<b-container>
					<b-row cols="2">
						<b-col v-for="(_, field) in searchIn" :key="field">
							<div class="py-2" style="min-width: 10rem">
								<b-form-checkbox switch v-model="searchIn[field]"> {{ field | toSentenceCase }} </b-form-checkbox>
							</div>
						</b-col>
					</b-row>
				</b-container>
			</b-dropdown>
		</b-btn>
	</b-input-group-append>
</template>

<script>
	import FilterIcon from "@/components/icons/filter.vue";

	export default {
		props: {
			searchIn: {
				type: Object,
				default: () => ({})
			}
		},
		components: { FilterIcon }
	};
</script>
