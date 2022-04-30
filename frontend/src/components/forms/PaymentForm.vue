<template>
	<default-modal id="paymentForm" @ok="handleSave" @hidden="resetModal" @show="isOpened" :settings="{ showStayOpenBtn: false }" :isBusy="isBusy">
		<template #title>
			<div class="d-flex align-items-center">
				<template v-if="isUpdate">
					<h6 class="mb-0">Edit Payment:&nbsp;</h6>
					<b-badge variant="outline-success" style="font-size: 75%">{{ payment.reference }}</b-badge>
				</template>
				<template v-else>
					<h6 class="mb-0">Create Payment:&nbsp;</h6>
					<b-badge variant="outline-primary" style="font-size: 75%">{{ invoice.reference }}</b-badge>
				</template>
			</div>
		</template>

		<b-form @submit.prevent="handleSave" v-if="invoice">
			<b-row cols="1" cols-sm="2">
				<!--------------- Date Input --------------->
				<b-col>
					<default-date-picker-input label="Date" field="date" :vuelidate="$v.payment" :namespace="namespace" />
				</b-col>

				<!-- -------------Payment Type------------- -->
				<b-col>
					<default-select label="Payment Type" field="paymentType" :options="typesOptions" :vuelidate="$v.payment" :namespace="namespace" />
				</b-col>

				<!-- -------------Amount------------- -->
				<b-col cols="12" sm="12" lg="6">
					<default-input ref="amountInput" label="Amount" field="amount" append="$" :vuelidate="$v.payment" :namespace="namespace" type="number" />
				</b-col>

				<!-- -------------Payment Amount Info------------- -->
				<b-col cols="12" sm="12" lg="6">
					<label class="payment-info-label d-none d-lg-inline-block"></label>
					<div class="payment-info d-flex align-items-center font-weight-500 mt-2 mb-3">
						<b-row cols="2" class="w-100 m-0">
							<b-col class="pl-0">
								<div class="border">
									<span class="text-muted">Total:&nbsp;</span>
									<span class="text-success">${{ invoice.total }}</span>
								</div>
							</b-col>
							<b-col class="px-0">
								<div class="border">
									<span class="text-muted">Due:&nbsp;</span>
									<span :class="'text-' + dueVariant">${{ due }}</span>
								</div>
							</b-col>
						</b-row>
					</div>
				</b-col>

				<!-- -------------Notes------------- -->
				<b-col cols="12" sm="12">
					<default-text-area rows="4" class="mb-0" label="Notes" placeholder="Enter Payment Notes" field="notes" :vuelidate="$v.payment" :namespace="namespace" />
				</b-col>
			</b-row>
		</b-form>
	</default-modal>
</template>

<script>
const DefaultDatePickerInput = () => import("@/components/inputs/DefaultDatePickerInput");

const DefaultInput = () => import("@/components/inputs/DefaultInput");

const DefaultSelect = () => import("@/components/inputs/DefaultSelect");

const DefaultTextArea = () => import("@/components/inputs/DefaultTextArea");

const DefaultModal = () => import("@/components/DefaultModal");

import { required, maxLength, helpers } from "vuelidate/lib/validators";

import { validationMixin } from "vuelidate";

import { showMessage } from "@/components/utils";

import { getDate } from "@/helpers";

const float = helpers.withParams({ type: "invalid" }, (num) => /^\d+$|^\d+\.\d+$|^\.\d+$/.test(num) && num > 0);

export default {
	props: ["namespace"],

	components: { DefaultDatePickerInput, DefaultInput, DefaultSelect, DefaultTextArea, DefaultModal },

	mixins: [validationMixin],

	data() {
		return {
			payment: {
				amount: 0,
				date: getDate(null, true),
				paymentType: "cash",
				notes: null
			},
			typesOptions: [
				{ _id: "cash", name: "Cash" },
				{ _id: "creditCard", name: "Credit Card" },
				{ _id: "cheque", name: "Cheque" },
				{ _id: "bankTransfer", name: "Bank Transfer" },
				{ _id: "westernUnion", name: "Western Union" },
				{ _id: "other", name: "Other" }
			],
			isBusy: false
		};
	},

	validations: {
		payment: {
			amount: { float },
			notes: { maxLength: maxLength(255) },
			paymentType: { required },
			date: { required }
		}
	},

	computed: {
		invoice() {
			return this.$store.state[this.namespace].one;
		},

		oldPayment() {
			return this.$store.state[this.namespace].oldPayment;
		},

		isUpdate() {
			return !!this.oldPayment && !!this.oldPayment._id;
		},

		due() {
			return this.invoice.total - this.paid - +this.payment.amount;
		},

		paid() {
			if (this.invoice.payments && this.invoice.payments.length) {
				let paid = this.invoice.payments.reduce((acc, payment) => acc + +payment.amount, 0);

				return this.isUpdate ? paid - this.oldPayment.amount : paid;
			}

			return this.isUpdate ? this.invoice.paid - this.oldPayment.amount : this.invoice.paid;
		},

		dueVariant() {
			return this.due == 0 ? "success" : this.due < 0 ? "warning" : "danger";
		}
	},

	methods: {
		async handleSave(bvt) {
			bvt.preventDefault();

			this.$v.$touch();

			if (this.$v.$invalid) return;

			this.isBusy = true;

			try {
				let action = this.isUpdate ? "updatePayment" : "createPayment";

				action = this.namespace + "/" + action;

				await this.$store.dispatch(action, this.payment);

				let message = this.isUpdate ? this.$t("messages.updated") : this.$t("messages.created");

				showMessage({ message });

				this.$nextTick(() => this.$bvModal.show("payments"));

				this.$bvModal.hide("paymentForm");
			} catch (err) {
				if (err) console.log(err);

				showMessage({ error: true });
			} finally {
				this.isBusy = false;
			}
		},

		isOpened() {
			if (this.isUpdate) {
				this.payment = { ...this.oldPayment };

				this.payment.date = getDate(this.oldPayment.date);
			} else {
				this.payment.amount = +this.due || 0;
			}

			setTimeout(() => this.$refs?.amountInput?.$children[0]?.$children[0]?.focus(), 300);
		},

		resetModal() {
			this.payment.amount = 0;
			this.payment.date = getDate(null, true);
			this.payment.paymentType = "cash";
			this.payment.notes = null;

			this.$store.commit(`${this.namespace}/setOldPayment`, null);

			this.$nextTick(this.$v.$reset);
		}
	}
};
</script>

<style scoped lang="scss">
.payment-info .col > div {
	height: calc(1.5em + 0.75rem + 2px);
	padding-top: 0.375rem;
	padding-bottom: 0.375rem;
	padding-left: 0.75rem;
	border-radius: 0.25rem;
	// background-color: #e9ecef;
}
</style>
