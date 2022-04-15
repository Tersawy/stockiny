<template>
	<b-form-group :label="label" :label-for="field">
		<b-form-textarea :id="field" :placeholder="placeholder" :rows="rows" v-model="vuelidate[field].$model" @input="removeError" :state="$hasError" :disabled="disabled" />
		<input-error :field="field" :namespace="namespace" :vuelidateField="vuelidate[field]" />
	</b-form-group>
</template>

<script>
	const InputError = () => import("@/components/ui/InputError");

	export default {
		components: { InputError },
		props: {
			label: { type: String, default: "" },
			rows: { type: String, default: "2" },
			placeholder: { type: String, default: "" },
			field: { type: String, required: true },
			disabled: { type: Boolean, default: false },
			namespace: { type: String, required: true },
			vuelidate: Object
		},
		computed: {
			$hasError() {
				const { $dirty, $error } = this.vuelidate[this.field];

				let error = this.$store.state[this.namespace].error;

				let isStoreError = error && error.field === this.field;

				if (isStoreError) return false;

				return $dirty ? ($error ? false : null) : null;
			}
		},
		methods: {
			removeError() {
				this.$store.commit(`${this.namespace}/resetErrorByField`, this.field);
			}
		}
	};
</script>
