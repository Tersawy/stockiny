<template>
	<Autocomplete :search="autoSearch" placeholder="Search in Products by code or name" @submit="selectProduct" ref="autocomplete">
		<template #result="{ result, props }">
			<li v-bind="props" class="d-flex">
				<b-avatar :src="`${BASE_URL}/images/products/${result.product}/${result.image}`"></b-avatar>
				<div class="mx-3">
					<h6 class="text-muted">{{ result.name }} - {{ result.code }}</h6>
					<span class="text-muted" v-if="result.variantName">{{ result.variantName }}</span>
				</div>
			</li>
		</template>
	</Autocomplete>
</template>

<script>
	import Autocomplete from "@trevoreyre/autocomplete-vue";

	import "@trevoreyre/autocomplete-vue/dist/style.css";

	export default {
		props: {
			invoice: { type: Object, required: true },

			productOptions: { type: Array, required: true }
		},

		components: { Autocomplete },

		methods: {
			autoSearch(input) {
				if (!input || !input.toString().length) return [];

				let unselected = [];

				for (let option of this.productOptions) {
					let isSelected = this.invoice.details.find(({ product, variantId }) => product == option.product && variantId == option.variantId);

					if (isSelected) continue;

					let hasName = option.name?.toLocaleLowerCase().indexOf(input.toLocaleLowerCase()) > -1;

					let hasCode = option.code?.indexOf(input) > -1;

					if (hasName || hasCode) unselected.push(option);
				}

				return unselected;
			},

			async selectProduct(product) {
				this.$refs.autocomplete.value = "";

				if (!product) return;

				this.$emit("add-to-detail", product);
			}
		}
	};
</script>

<style lang="scss">
	.autocomplete-result-list {
		z-index: 3 !important;
	}
</style>
