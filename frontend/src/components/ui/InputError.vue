<template>
	<div class="input-error text-danger">{{ msg() }}</div>
</template>

<script>
	export default {
		props: ["vuelidateField", "field", "namespace", "customError"],

		computed: {
			storeError() {
				// e.g. this.$store.state.Warehouses.error, this.$store.state.Brands.error
				return this.$store.state[this.namespace].error;
			},

			isCustomError() {
				return !!this.customError?.field;
			},

			/* 
				fieldName: e.g. "name", "email", "password"
			*/
			isStoreError() {
				if (!this.namespace) return false;

				let error = this.$store.state[this.namespace].error;
				// e.g. this.$store.state.Warehouses.error.field === "name", this.$store.state.Brands.error.field === "name"
				return error.field == this.field;
			},

			/* 
				vuelidateField: e.g. this.$v.warehouse.name, this.$v.brand.name
			*/
			isVuelidateError() {
				// e.g. return this.$v.warehouse.name.$invalid && this.$v.warehouse.name.$dirty;
				// e.g. return this.$v.brand.name.$invalid && this.$v.brand.name.$dirty;
				return this.vuelidateField && this.vuelidateField.$invalid && this.vuelidateField.$dirty;
			}
		},

		methods: {
			msg() {
				if (this.isCustomError) {
					return this.getMsg(this.customError.message, this.customError.field);
				}

				if (this.isStoreError) {
					return this.getMsg(this.storeError.message, this.field);
				}

				if (this.isVuelidateError) {
					let attrs = Object.keys(this.vuelidateField.$params); // e.g. ["minLength", "maxLength", "required"]

					for (let attr of attrs) {
						// e.g. !this.$v.warehouse.name.required
						if (!this.vuelidateField[attr]) {
							// e.g. this.$v.warehouse.name.$params.email.type this check because email is not have type attribute
							if (!this.vuelidateField.$params[attr].type) {
								// for email or any other field that doesn't have a type
								return this.getMsg({ type: attr }, this.field);
							} else {
								return this.getMsg(this.vuelidateField.$params[attr], this.field);
							}
						}
					}
				}
				return "";
			},

			/* 
				@param message: {
					type: String,
					value: String
				}
				@param field: String e.g. "name", "email", "password"
			*/
			getMsg(message, fieldName) {
				if (!message || !message.type) return "";

				message = JSON.parse(JSON.stringify(message));

				let type = message.type;

				delete message.type;

				message.field = this.toSentenceCase(fieldName);

				return this.$t(`validation.${type}`, message);
			},

			// trasfrom text from camelCase to sentence case
			// e.g. "camelCase" => "Camel Case"
			toSentenceCase(text) {
				return text.replace(/([A-Z])/g, " $1").replace(/^./, function (str) {
					return str.toLowerCase().toUpperCase();
				});
			}
		}
	};
</script>
