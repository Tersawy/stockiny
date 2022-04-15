<template>
	<b-form-group label="Date" label-for="date">
		<b-form-datepicker id="date" locale="en" v-model="object.date" />
	</b-form-group>
</template>

<script>
	export default {
		props: ["object"]
	};
</script>
