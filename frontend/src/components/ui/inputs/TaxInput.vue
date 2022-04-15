<template>
	<default-input class="tax-input" label="Order Tax ( % )" placeholder="Enter Order Tax" field="tax" :vuelidate="vuelidate" :namespace="namespace" type="number">
		<b-input-group-prepend>
			<b-button :variant="btnVariant" @click="changeTaxMethod">
				<span class="h6 mb-0" v-if="isExclusive">Exclusive</span>
				<span class="h6 mb-0" v-else>Inclusive</span>
			</b-button>
		</b-input-group-prepend>
	</default-input>
</template>

<script>
	const DefaultInput = () => import("@/components/ui/DefaultInput");

	export default {
		components: { DefaultInput },

		props: ["namespace", "vuelidate"],

		data() {
			return {
				taxMethodOptions: [
					{ name: "Inclusive", _id: "inclusive" },
					{ name: "Exclusive", _id: "exclusive" }
				]
			};
		},

		methods: {
			changeTaxMethod() {
				this.vuelidate.taxMethod.$model = this.vuelidate.taxMethod.$model == "inclusive" ? "exclusive" : "inclusive";
			}
		},

		computed: {
			isExclusive() {
				return this.vuelidate.taxMethod.$model === "exclusive";
			},

			btnVariant() {
				return this.isExclusive ? "outline-primary" : "outline-success";
			}
		}
	};
</script>

<style lang="scss">
	.tax-input {
		input {
			border-right: 0;
		}
	}
</style>
