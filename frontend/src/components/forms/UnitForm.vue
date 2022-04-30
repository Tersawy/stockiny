<template>
	<default-modal id="unitFormModal" @ok="handleSave" @hidden="resetForm" :isBusy="isBusy" :title="formTitle" @show="isOpened" :settings="modalSettings">
		<div class="unit-form">
			<b-form v-on:submit="handleSave">
				<b-row cols="1" cols-md="2">
					<!-- Name Input -->
					<b-col>
						<default-input ref="inputName" label="Name" placeholder="Enter Unit Name" field="name" :vuelidate="$v.unit" namespace="Units" />
					</b-col>
					<!-- Short Name Input -->
					<b-col>
						<default-input label="Short Name" placeholder="Enter Unit Short Name" field="shortName" :vuelidate="$v.unit" namespace="Units" />
					</b-col>
					<!-- Base Unit Input -->
					<b-col md="12">
						<default-select label="Main Unit" field="base" :options="baseOptions" :vuelidate="$v.unit" namespace="Units" />
					</b-col>
					<template v-if="unit.base">
						<!-- Value Input -->
						<b-col>
							<default-input label="Value" placeholder="Enter Unit Value" field="value" :vuelidate="$v.unit" namespace="Units" type="number" />
						</b-col>
						<!-- Operator Input -->
						<b-col>
							<default-select label="Operator" field="operator" value-field="value" :options="operatorOptions" :vuelidate="$v.unit" namespace="Units" />
						</b-col>
					</template>
				</b-row>
				<input type="submit" hidden />
			</b-form>
		</div>
	</default-modal>
</template>

<script>
import { mapActions, mapState } from "vuex";

import { required, minLength, maxLength, minValue, numeric, requiredIf } from "vuelidate/lib/validators";

import { validationMixin } from "vuelidate";

const DefaultInput = () => import("@/components/inputs/DefaultInput");

const DefaultSelect = () => import("@/components/inputs/DefaultSelect");

const DefaultModal = () => import("@/components/DefaultModal");

export default {
	components: { DefaultModal, DefaultInput, DefaultSelect },

	mixins: [validationMixin],

	data: () => ({
		unit: { name: "", shortName: "", value: 1, operator: "*", base: null },

		isBusy: false,

		modalSettings: { stayOpen: false, showStayOpenBtn: true },

		operatorOptions: [
			{ name: "Multiply (*)", value: "*" },
			{ name: "Divide (/)", value: "/" }
		]
	}),

	validations: {
		unit: {
			name: { required, minLength: minLength(3), maxLength: maxLength(54) },
			shortName: { required, minLength: minLength(1), maxLength: maxLength(54) },
			base: {},
			value: {
				required: requiredIf(function () {
					return !!this.unit.base;
				}),
				numeric,
				minValue: minValue(1)
			},
			operator: {
				required: requiredIf(function () {
					return !!this.unit.base;
				}),
				minLength: minLength(1),
				maxLength: maxLength(1)
			}
		}
	},

	mounted() {
		this.getBaseOptions();
	},

	watch: {
		"unit.base": function (newValue) {
			if (!newValue) {
				this.unit.value = 1;
				this.unit.operator = "*";
			}
		}
	},

	computed: {
		...mapState({
			oldUnit: (state) => state.Units.one,
			baseOptions: (state) => state.Units.baseOptions
		}),

		isUpdate() {
			return !!this.oldUnit._id;
		},

		formTitle() {
			return this.isUpdate ? "Edit Unit" : "Create Unit";
		}
	},

	methods: {
		...mapActions("Units", ["create", "update", "getBaseOptions", "getOptions"]),

		isOpened() {
			if (this.isUpdate) {
				for (let key in this.unit) {
					if (key == "base" && this.oldUnit[key]) {
						this.unit[key] = this.oldUnit[key]._id || null;
						continue;
					}

					this.unit[key] = this.oldUnit[key];
				}

				this.modalSettings.showStayOpenBtn = false;
			} else {
				this.resetForm();
				this.modalSettings.showStayOpenBtn = true;
			}

			setTimeout(() => {
				this.$refs?.inputName?.$children[0]?.$children[0]?.focus();
			}, 300);
		},

		async handleSave(bvt) {
			bvt.preventDefault();

			this.$v.$touch();

			if (this.$v.unit.$invalid) return;

			this.isBusy = true;

			try {
				let action = this.isUpdate ? this.update : this.create;

				let res = await action(this.unit);

				let message = "actions.created";

				if (res.status == 200) {
					message = "actions.updated";
				}

				message = this.$t(message, { module: "Unit" });

				this.$store.commit("showToast", message);

				this.resetForm();

				this.getBaseOptions();
				this.getOptions();

				if (!this.modalSettings.showStayOpenBtn || !this.modalSettings.stayOpen) {
					return this.$bvModal.hide("unitFormModal");
				}

				this.$refs?.inputName?.$children[0]?.$children[0]?.focus();
			} catch (e) {
				this.$store.commit("Units/setError", e);
			} finally {
				this.isBusy = false;
			}
		},

		resetForm() {
			this.unit = { name: "", shortName: "", value: 1, operator: "*", base: null };

			this.$store.commit("Units/setOne", {});

			this.$store.commit("Units/resetError");

			this.$nextTick(this.$v.$reset);
		}
	}
};
</script>
