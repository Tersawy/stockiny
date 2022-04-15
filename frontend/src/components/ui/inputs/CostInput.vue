<template>
	<b-form-group label="Product Cost" label-for="unit_cost">
		<b-input-group append="$">
			<b-form-input type="number" min="0" id="unit_cost" placeholder="unit_cost" v-model.number="object.unit_cost" />
		</b-input-group>
	</b-form-group>
</template>

<script>
	export default {
		props: ["object"]
	};
</script>
