<template>
	<b-form-group label="Payment Type" label-for="payment_method">
		<b-select id="payment_method" v-model.number="object.payment_method" :options="taxMethods" />
	</b-form-group>
</template>

<script>
	export default {
		props: ["object"],
		computed: {
			taxMethods() {
				return this.$store.state.paymentMethods;
			}
		}
	};
</script>
