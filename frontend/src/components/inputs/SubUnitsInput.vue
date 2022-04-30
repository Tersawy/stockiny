<template>
	<default-select :options="subUnitsOptions" :vuelidate="vuelidate" :field="field" :label="label" :namespace="namespace" />
</template>

<script>
const DefaultSelect = () => import("@/components/inputs/DefaultSelect");

export default {
	components: { DefaultSelect },

	props: {
		mainUnitId: { type: String },
		label: { type: String, default: "Sub unit" },
		vuelidate: { type: Object },
		namespace: { type: String },
		field: { type: String }
	},

	computed: {
		unitsOptions() {
			return this.$store.state.Units.options;
		},

		subUnitsOptions() {
			return this.unitsOptions.find((unit) => unit._id == this.mainUnitId)?.subUnits || [];
		}
	}
};
</script>

<style></style>
