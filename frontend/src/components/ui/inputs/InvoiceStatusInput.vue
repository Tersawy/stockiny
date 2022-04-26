<template>
	<default-select ref="selectInput" label="Status" field="status" :options="options" :vuelidate="vuelidate" :namespace="namespace" />
</template>

<script>
const DefaultSelect = () => import("@/components/ui/DefaultSelect");

export default {
	components: { DefaultSelect },

	props: ["vuelidate", "namespace", "invoiceName"],

	async mounted() {
		let { options } = await this.getOptions();

		let effectedOption = options.find((option) => option.effected);

		if (effectedOption) {
			this.$emit("mounted", effectedOption, options);
		}

		setTimeout(() => {
			if (this.selectInput) {
				let that = this;
				this.selectInput.style.borderColor = that.selectedOption.color;

				this.selectInput.onfocus = function () {
					this.style.boxShadow = `0 0 0 0.06rem ${that.selectedOption.color}40`;
				};

				this.selectInput.onblur = function () {
					this.style.boxShadow = "none";
				};
			}
		});
	},

	watch: {
		"vuelidate.status.$model": {
			handler() {
				if (this.selectInput) {
					this.selectInput.style.borderColor = this.selectedOption.color;
				}
			},
			deep: true
		}
	},

	computed: {
		options() {
			return this.$store.state.Invoices.statuses[this.invoiceName];
		},

		selectedOption() {
			return this.options.find((option) => this.vuelidate.status.$model == option._id) || {};
		},

		selectInput() {
			return this.$refs.selectInput?.$refs?.customSelect?.$refs?.input;
		}
	},

	methods: {
		getOptions() {
			return this.$store.dispatch("Invoices/getStatusOptions", this.invoiceName);
		}
	}
};
</script>
