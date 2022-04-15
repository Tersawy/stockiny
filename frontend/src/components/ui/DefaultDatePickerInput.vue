<template>
	<b-form-group :label="label" :label-for="field">
		<b-form-datepicker
			:id="field"
			v-model="vuelidate[field].$model"
			@input="removeError"
			:state="$hasError"
			:disabled="disabled"
			:min="min"
			:max="max"
			:locale="locale"
			:size="size"
			:start-weekday="weekday"
		/>
		<input-error :field="field" :namespace="namespace" :vuelidateField="vuelidate[field]" />
	</b-form-group>
</template>

<script>
	const InputError = () => import("@/components/ui/InputError");

	export default {
		components: { InputError },
		props: {
			label: { type: String, default: "" },
			locale: { type: String, default: "en" },
			min: { type: String, default: "" },
			max: { type: String, default: "" },
			disabled: { type: Boolean, default: false },
			size: { type: String, default: "md" },
			weekday: { type: Number, default: 0 },
			field: { type: String, required: true },
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
