<template>
	<default-input class="discount-input" label="Discount" field="discount" :vuelidate="vuelidate" namespace="Purchases" type="number">
		<b-input-group-prepend>
			<b-button variant="outline-primary" @click="changeDiscountMethod">
				<span class="h6 mb-0" v-if="vuelidate.discountMethod.$model === 'fixed'">$</span>
				<span class="h6 mb-0" v-else>%</span>
			</b-button>
		</b-input-group-prepend>
	</default-input>
</template>

<script>
const DefaultInput = () => import("@/components/inputs/DefaultInput");

export default {
	components: { DefaultInput },

	props: ["namespace", "vuelidate"],

	methods: {
		changeDiscountMethod() {
			this.vuelidate.discountMethod.$model = this.vuelidate.discountMethod.$model == "fixed" ? "percent" : "fixed";
		}
	}
};
</script>

<style lang="scss">
.discount-input {
	input {
		border-right: 0;
	}
}
</style>
