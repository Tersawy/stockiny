<template>
	<default-select ref="selectInput" label="Status" field="status" :options="statuses" :vuelidate="vuelidate" :namespace="namespace" />
</template>

<script>
const DefaultSelect = () => import("@/components/ui/DefaultSelect");

export default {
	components: { DefaultSelect },

	props: ["vuelidate", "namespace"],

	async mounted() {
		let { statuses } = await this.getStatuses();

		let effectedOption = statuses.find((option) => option.effected);

		if (effectedOption) {
			this.$emit("mounted", effectedOption, statuses);
		}

		setTimeout(() => {
			if (this.selectInput) {
				let that = this;
				this.selectInput.style.borderColor = that.selectedStatus.color;

				this.selectInput.onfocus = function () {
					this.style.boxShadow = `0 0 0 0.06rem ${that.selectedStatus.color}40`;
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
					this.selectInput.style.borderColor = this.selectedStatus.color;
				}
			},
			deep: true
		}
	},

	computed: {
		statuses() {
			return this.$store.state[this.namespace].statuses;
		},

		selectedStatus() {
			return this.statuses.find((option) => this.vuelidate.status.$model == option._id) || {};
		},

		selectInput() {
			return this.$refs.selectInput?.$refs?.customSelect?.$refs?.input;
		}
	},

	methods: {
		getStatuses() {
			return this.$store.dispatch(`${this.namespace}/getStatuses`);
		}
	}
};
</script>
