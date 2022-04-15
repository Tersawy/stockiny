<template>
	<div class="main-content py-4" @click="$store.commit('setSidebar', false)">
		<b-container fluid class="px-3 px-md-4">
			<b-card class="mb-4 rounded shadow-sm" no-body>
				<div class="d-flex align-items-center justify-content-between flex-column flex-sm-row pr-3">
					<b-breadcrumb class="mb-0 bg-transparent mr-0 mr-sm-auto" v-if="isAuth">
						<b-breadcrumb-item v-for="(bread, i) in breads" :key="i" :active="true">
							<HomeIcon v-if="breads.length === 1" color="#6c757d" class="mr-1 mb-1" />
							<span v-if="!bread.link">{{ bread.title }}</span>
							<router-link v-else :to="bread.link">
								<HomeIcon color="var(--primary)" class="mr-1 mb-1" v-if="i === 0" />
								<span>{{ bread.title }}</span>
							</router-link>
						</b-breadcrumb-item>
					</b-breadcrumb>
					<div :class="{ 'my-3 my-sm-0': hasEndBreadsSlot }">
						<slot name="end-breads"></slot>
					</div>
				</div>
			</b-card>
			<slot name="default"></slot>
		</b-container>
	</div>
</template>

<script>
	import HomeIcon from "@/components/icons/home.vue";

	export default {
		components: { HomeIcon },

		props: {
			breads: { type: Array, default: () => [] }
		},

		computed: {
			hasEndBreadsSlot() {
				return !!this.$slots["end-breads"];
			}
		}
	};
</script>
