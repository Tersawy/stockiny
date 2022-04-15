<template>
	<b-form-group label="Note" label-for="note">
		<b-form-textarea id="note" v-model="object.note" placeholder="Enter something..." />
	</b-form-group>
</template>

<script>
	export default {
		props: ["object"]
	};
</script>
