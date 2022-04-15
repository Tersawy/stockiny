<template>
	<b-form-group label="Product Price" label-for="unit_price">
		<b-input-group append="$">
			<b-form-input type="number" min="0" id="unit_price" placeholder="unit_price" v-model.number="object.unit_price" />
		</b-input-group>
	</b-form-group>
</template>

<script>
	export default {
		props: ["object"]
	};
</script>
