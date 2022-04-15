<template>
	<b-form-group label="Amount" label-for="amount">
		<b-input-group append="$">
			<b-form-input v-bind="inputProps" type="number" min="0" id="amount" placeholder="amount" v-model.number="object.amount" />
		</b-input-group>
	</b-form-group>
</template>

<script>
	export default {
		props: ["object", "inputProps"]
	};
</script>
