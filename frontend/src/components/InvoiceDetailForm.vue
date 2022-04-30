<template>
	<default-modal id="productDetailModal" @ok="handleSave" @hidden="$emit('reset-modal')" :settings="{ showStayOpenBtn: false }" :modal-props="{ size: 'md' }">
		<b-form @submit.prevent="handleSave" v-if="detail">
			<!-- -------------Detail Unit Amount------------- -->
			<default-input
				:label="`Product ${amountType}`"
				:placeholder="`Enter Product ${amountType}`"
				field="subUnitAmount"
				:vuelidate="$v.detail"
				:namespace="namespace"
				type="number"
			/>

			<!-- -------------Detail Tax------------- -->
			<tax-input :vuelidate="$v.detail" :namespace="namespace" />

			<!-- -------------Detail Discount------------- -->
			<discount-input :vuelidate="$v.detail" :namespace="namespace" />

			<!-- -------------Detail Sub Unit------------- -->
			<sub-units-input :main-unit-id="detail.unit" :label="unitLabel" field="subUnit" :vuelidate="$v.detail" :namespace="namespace" />

			<input type="submit" hidden class="d-none" style="display: none" />
		</b-form>
	</default-modal>
</template>

<script>
const DiscountInput = () => import("@/components/inputs/DiscountInput");

const TaxInput = () => import("@/components/inputs/TaxInput");

const DefaultInput = () => import("@/components/inputs/DefaultInput");

const SubUnitsInput = () => import("@/components/inputs/SubUnitsInput");

const DefaultModal = () => import("@/components/DefaultModal");

import { required, numeric, minValue } from "vuelidate/lib/validators";

import { validationMixin } from "vuelidate";

export default {
	components: { DiscountInput, TaxInput, DefaultInput, SubUnitsInput, DefaultModal },

	mixins: [validationMixin],

	props: {
		namespace: { type: String, required: true },

		amountType: { type: String, required: true },

		detail: { type: Object }
	},

	validations: {
		detail: {
			tax: { numeric, minValue: minValue(0) },
			taxMethod: { required },
			discount: { numeric, minValue: minValue(0) },
			discountMethod: { required },
			subUnit: { required },
			subUnitAmount: { required, numeric, minValue: minValue(1) }
		}
	},

	computed: {
		unitLabel() {
			return this.amountType == "Price" ? "Sale Unit" : "Purchase Unit";
		}
	},

	methods: {
		handleSave(evt) {
			this.$v.$touch();

			if (this.$v.$invalid) {
				if (evt) evt.preventDefault();
				return;
			}

			this.$emit("done", this.detail);

			this.$bvModal.hide("productDetailModal");
		}
	}
};
</script>
