<template>
	<b-overlay :show="isBusy" spinner-small spinner-variant="primary">
		<Autocomplete :search="autoSearch" placeholder="Search in Products by code or name" @submit="submit" ref="autocomplete">
			<template #result="{ result, props }">
				<li v-bind="props" class="d-flex">
					<b-avatar v-if="result.image" :src="`${BASE_URL}/images/products/${result.product}/${result.image}`"></b-avatar>
					<div v-else class="p-3 border rounded text-center"><GalleryIcon scale="2.5" color="#999" /></div>
					<div class="mx-3">
						<h6 class="text-muted">{{ result.name }} - {{ result.code }}</h6>
						<span class="text-muted" v-if="result.variantName">{{ result.variantName }}</span>
					</div>
				</li>
			</template>
		</Autocomplete>
	</b-overlay>
</template>

<script>
import Autocomplete from "@trevoreyre/autocomplete-vue";

import GalleryIcon from "@/components/icons/gallery";

import "@trevoreyre/autocomplete-vue/dist/style.css";

export default {
	props: {
		options: { type: Array, required: true },

		isBusy: { type: Boolean, required: false },

		onSelect: { type: Function, required: true },

		selected: { type: Array, required: true }
	},

	components: { Autocomplete, GalleryIcon },

	methods: {
		autoSearch(input) {
			if (!input || !input.toString().length) return [];

			let unselected = [];

			for (let option of this.options) {
				let isSelected = this.selected.find(({ product, variantId }) => product == option.product && variantId == option.variantId);

				if (isSelected) continue;

				let hasName = option.name?.toLocaleLowerCase().indexOf(input.toLocaleLowerCase()) > -1;

				let hasCode = option.code?.indexOf(input) > -1;

				if (hasName || hasCode) unselected.push(option);
			}

			return unselected;
		},

		async submit(product) {
			this.$refs.autocomplete.value = "";

			if (!product) return;

			await this.onSelect(product);
		}
	}
};
</script>

<style lang="scss">
.autocomplete-result-list {
	z-index: 3 !important;
}
</style>
