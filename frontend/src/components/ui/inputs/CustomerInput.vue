<template>
	<b-form-group label="Customer" label-for="customer_id">
		<b-select id="customer_id" v-model.number="object.customer_id" :options="customersOpt" />
	</b-form-group>
</template>

<script>
	export default {
		props: ["object"],
		computed: {
			customersOpt() {
				return this.$store.state.Customers.options;
			}
		}
	};
</script>
