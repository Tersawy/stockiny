<template>
	<b-form-group :label="label" :label-for="field">
		<b-form-file
			:accept="accept"
			:multiple="multiple"
			:id="field"
			:placeholder="placeholder"
			v-model="vuelidate[field].$model"
			@input="onInput"
			:state="$hasError"
			:disabled="disabled"
		>
			<!-- @change="changed" -->
			<template slot="file-name" slot-scope="{ names }">
				<b-badge variant="dark">{{ names[0] }}</b-badge>
				<b-badge v-if="vuelidate[field].$model > 1" variant="dark" class="ml-1"> + {{ vuelidate[field].$model.length - 1 }} More files </b-badge>
			</template>
		</b-form-file>
		<input-error :field="field" :namespace="namespace" :vuelidateField="vuelidate[field]" />
	</b-form-group>
</template>

<script>
	const InputError = () => import("@/components/ui/InputError");

	export default {
		components: { InputError },
		props: {
			label: { type: String, default: "" },
			placeholder: { type: String, default: "" },
			multiple: { type: Boolean, default: false },
			accept: { type: String, default: ".jpg, .png, .jpeg" },
			fileSize: { type: Number, default: 5 },
			max: { type: Number, default: 5 },
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
			onInput(files) {
				if (!files) return;

				this.removeError();

				if (!this.multiple) return this.handleFile(files);

				for (let file of files) {
					this.handleFile(file);
				}
			},

			handleFile(file) {
				let extensions = this.accept.match(/(\w+)/g);

				let mime = file.type;

				let extension = mime.split("/")[1];

				if (this.multiple) {
					this.vuelidate[this.field].$model = Array.isArray(this.vuelidate[this.field].$model) ? this.vuelidate[this.field].$model : [];

					if (this.vuelidate[this.field].$model.length == this.max) {
						setTimeout(this.vuelidate[this.field].$model.pop, 0);
						return this.$store.commit(`${this.namespace}/setError`, { field: `${this.field}s`, message: { type: "maxValue", max: this.max } });
					}
				}

				if (!extensions.includes(extension)) {
					if (this.multiple) {
						setTimeout(this.vuelidate[this.field].$model.pop, 0);
					} else {
						setTimeout(() => {
							this.vuelidate[this.field].$model = null;
						}, 0);
					}
					return this.$store.commit(`${this.namespace}/setError`, { field: this.field, message: { type: "enum", value: extensions } });
				}

				if (this.fileSize * 1024 * 1024 < file.size) {
					if (this.multiple) {
						setTimeout(this.vuelidate[this.field].$model.pop, 0);
					} else {
						setTimeout(() => {
							this.vuelidate[this.field].$model = null;
						}, 0);
					}
					return this.$store.commit(`${this.namespace}/setError`, { field: this.field, message: { type: "maxValue", max: `${this.fileSize} MB` } });
				}
			},

			removeError() {
				this.$store.commit(`${this.namespace}/resetErrorByField`, this.field);
			}

			// changed(e) {
			// 	let extensions = this.accept.match(/(\w+)/g);

			// 	for (let file of e.target.files) {
			// 		let mime = file.type;

			// 		let extension = mime.split("/")[1];

			// 		if (!extensions.includes(extension)) {
			// 			if (Array.isArray(this.vuelidate[this.field].$model)) {
			// 				setTimeout(() => {
			// 					this.vuelidate[this.field].$model = this.vuelidate[this.field].$model.filter((f) => f.name !== file.name);
			// 				}, 0);
			// 			} else {
			// 				setTimeout(() => {
			// 					this.vuelidate[this.field].$model = null;
			// 				}, 0);
			// 			}
			// 		}
			// 	}
			// },
		}
	};
</script>
