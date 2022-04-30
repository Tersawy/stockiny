<template>
	<b-form-group :label="label" :label-for="field">
		<b-input-group :append="append">
			<b-form-input
				:type="type"
				:id="field"
				:placeholder="placeholder"
				v-model="vuelidate[field].$model"
				@input="removeError"
				:state="$hasError"
				:disabled="disabled"
				@focus="focus"
			/>
			<slot></slot>
		</b-input-group>
		<input-error :field="field" :namespace="namespace" :vuelidateField="vuelidate[field]" />
	</b-form-group>
</template>

<script>
const InputError = () => import("@/components/InputError");

export default {
	components: { InputError },
	props: {
		type: { type: String, default: "text" },
		label: { type: String, default: "" },
		placeholder: { type: String, default: "" },
		append: { type: String, default: "" },
		field: { type: String, required: true },
		disabled: { type: Boolean, default: false },
		namespace: { type: String, required: true },
		vuelidate: Object
	},
	// data: () => ({
	// 	id: "input",
	// 	counter: 1
	// }),
	// created() {
	// 	this.id = "input" + this.counter++;
	// },
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
		},
		focus(e) {
			if (e.currentTarget) {
				e.currentTarget?.select();
				// e.currentTarget?.setSelectionRange(0, this.vuelidate[this.field].$model.length);
			}
		}
	}
};
</script>
