<template>
	<default-modal
		id="currencyFormModal"
		@ok="handleSave"
		@hidden="resetForm"
		:isBusy="isBusy"
		:title="formTitle"
		@show="isOpened"
		:stayOpen.sync="modalSettings.stayOpen"
		:showStayOpenBtn="modalSettings.showStayOpenBtn"
	>
		<div class="currency-form">
			<b-form v-on:submit="handleSave">
				<b-row cols="1" cols-md="2">
					<!-- Name Input -->
					<b-col>
						<default-input ref="inputName" label="Name" placeholder="Enter Currency Name" field="name" :vuelidate="$v.currency" namespace="Currencies" />
					</b-col>
					<!-- Code Input -->
					<b-col>
						<default-input label="Code" placeholder="Enter Currency Code" field="code" :vuelidate="$v.currency" namespace="Currencies" />
					</b-col>
					<!-- Symbol Input -->
					<b-col>
						<default-input label="Symbol" placeholder="Enter Currency Symbol" field="symbol" :vuelidate="$v.currency" namespace="Currencies" />
					</b-col>
				</b-row>
				<input type="submit" hidden />
			</b-form>
		</div>
	</default-modal>
</template>

<script>
import { mapActions, mapState } from "vuex";

import { required, minLength, maxLength } from "vuelidate/lib/validators";

import { validationMixin } from "vuelidate";

const DefaultInput = () => import("@/components/inputs/DefaultInput");

const DefaultModal = () => import("@/components/DefaultModal");

export default {
	components: { DefaultModal, DefaultInput },

	mixins: [validationMixin],

	data: () => ({
		currency: { name: null, code: null, symbol: null },

		isBusy: false,

		modalSettings: { stayOpen: false, showStayOpenBtn: true }
	}),

	validations: {
		currency: {
			name: { required, minLength: minLength(3), maxLength: maxLength(54) },
			code: { required, minLength: minLength(1), maxLength: maxLength(5) },
			symbol: { required, minLength: minLength(1), maxLength: maxLength(5) }
		}
	},

	computed: {
		...mapState({
			oldCurrency: (state) => state.Currencies.one
		}),

		isUpdate() {
			return !!this.oldCurrency._id;
		},

		formTitle() {
			return this.isUpdate ? "Edit Currency" : "Create Currency";
		}
	},

	methods: {
		...mapActions("Currencies", ["create", "update"]),

		isOpened() {
			if (this.isUpdate) {
				for (let key in this.currency) {
					this.currency[key] = this.oldCurrency[key] || "";
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

			if (this.$v.currency.$invalid) return;

			this.isBusy = true;

			try {
				let action = this.isUpdate ? this.update : this.create;

				let res = await action(this.currency);

				let message = "actions.created";

				if (res.status == 200) {
					message = "actions.updated";
				}

				message = this.$t(message, { module: "Currency" });

				this.$store.commit("showToast", message);

				this.resetForm();

				if (!this.modalSettings.showStayOpenBtn || !this.modalSettings.stayOpen) {
					return this.$bvModal.hide("currencyFormModal");
				}

				this.$refs?.inputName?.$children[0]?.$children[0]?.focus();
			} catch (e) {
				this.$store.commit("Currencies/setError", e);
			} finally {
				this.isBusy = false;
			}
		},

		resetForm() {
			for (let key in this.currency) {
				this.currency[key] = "";
			}

			this.$store.commit("Currencies/setOne", {});

			this.$store.commit("Currencies/resetError");

			this.$nextTick(this.$v.$reset);
		}
	}
};
</script>
