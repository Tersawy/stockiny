<template>
	<main-content :breads="breads"> </main-content>
</template>

<script>
export default {
	data: () => ({
		breads: [{ title: "Dashboard", link: "/" }, { title: "Settings" }]
	})
};
</script>