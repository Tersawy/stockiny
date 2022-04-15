<template>
	<b-modal id="paymentForm" @hidden="resetModal" hide-footer @ok="handleSave" size="lg" @show="modalIsShown">
		<template #modal-header="{ close }">
			<div class="d-flex align-items-center justify-content-between w-100">
				<div class="d-flex align-items-center">
					<template v-if="isUpdate">
						<h6 class="mb-0">Update Payment:&nbsp;</h6>
						<b-badge variant="outline-success" class="font-weight-500">{{ payment.reference }}</b-badge>
					</template>
					<template v-else>
						<h6 class="mb-0">Create Payment for:&nbsp;</h6>
						<b-badge variant="outline-primary" class="font-weight-500">{{ invoice.reference }}</b-badge>
					</template>
				</div>
				<b-button size="sm" variant="outline-danger" @click="close()"> Close </b-button>
			</div>
		</template>
		<template #default="{ ok }">
			<b-form @submit.prevent="handleSave" v-if="invoice">
				<b-row>
					<!-- -------------Date------------- -->
					<b-col cols="6">
						<date-input :object="payment" />
						<input-error :vuelidate="$v.payment.date" field="date" :namespace="namespace" />
					</b-col>

					<!-- -------------Amount------------- -->
					<b-col cols="6">
						<amount-input :object="payment" ref="amountInput" :inputProps="{ ref: 'input' }" />
						<input-error :vuelidate="$v.payment.amount" field="amount" :namespace="namespace" />
					</b-col>

					<!-- -------------Payment Method------------- -->
					<b-col cols="6">
						<payment-methods-input :object="payment" />
						<input-error :vuelidate="$v.payment.payment_method" field="payment_method" :namespace="namespace" />
					</b-col>

					<!-- -------------Payment Amount Info------------- -->
					<b-col cols="6">
						<label class="payment-info-label"><!-- Purchase Payment Info --></label>
						<div class="payment-info d-flex align-items-center font-weight-500 mt-2">
							<div class="d-flex align-items-center w-50">
								<span class="text-muted">Total:&nbsp;</span>
								<!-- <b-badge variant="outline-success">$ {{ invoice.total_price }}</b-badge> -->
								<span class="text-success">${{ invoice.total_price }}</span>
							</div>
							<div class="d-flex align-items-center">
								<span class="text-muted">Due:&nbsp;</span>
								<!-- <b-badge :variant="'outline-' + dueVariant">$ {{ due }}</b-badge> -->
								<span :class="'text-' + dueVariant">${{ due }}</span>
							</div>
						</div>
					</b-col>

					<!-- -------------Notes------------- -->
					<b-col cols="12">
						<note-input :object="payment" />
						<input-error :vuelidate="$v.payment.note" field="note" :namespace="namespace" />
					</b-col>
				</b-row>
				<div class="text-right">
					<b-btn v-if="isUpdate" @click="ok()" variant="outline-success">Update</b-btn>
					<b-btn v-else @click="ok()" variant="outline-primary">Save</b-btn>
				</div>
			</b-form>
		</template>
	</b-modal>
</template>

<script>
	import DateInput from "@/components/ui/inputs/DateInput";
	import AmountInput from "@/components/ui/inputs/AmountInput";
	import PaymentMethodsInput from "@/components/ui/inputs/PaymentMethodsInput";
	import NoteInput from "@/components/ui/inputs/NoteInput";

	import { PAYMENT_CASH } from "@/helpers/constants";
	import { required, numeric, maxLength, minValue } from "vuelidate/lib/validators";

	export default {
		props: ["namespace"],

		components: { DateInput, AmountInput, PaymentMethodsInput, NoteInput },

		data() {
			let zeroFill = (v) => (+v < 10 ? `0${v}` : v);

			let [m, d, y] = new Date().toLocaleDateString().split("/");

			const today = `${y}-${zeroFill(m)}-${zeroFill(d)}`;

			return {
				payment: {
					amount: 0,
					date: today,
					payment_method: PAYMENT_CASH,
					note: null
				}
			};
		},

		validations: {
			payment: {
				amount: { required, numeric, minValue: minValue(1) },
				note: { maxLength: maxLength(255) },
				payment_method: { numeric, minValue: minValue(0) },
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
				return this.invoice.total_price - this.paid - +this.payment.amount;
			},

			paid() {
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

				try {
					if (this.isUpdate) {
						await this.$store.dispatch(`${this.namespace}/updatePayment`, this.payment);

						this.$bvModal.hide("paymentForm");
					} else {
						await this.$store.dispatch(`${this.namespace}/createPayment`, this.payment);

						this.$bvModal.hide("paymentForm");

						this.$nextTick(() => {
							this.$bvModal.show("payments");
						});
					}
				} catch (err) {
					if (err) console.log(err);
				}
			},

			modalIsShown() {
				setTimeout(() => this.$refs.amountInput?.$refs.input?.focus(), 400);

				if (this.isUpdate) {
					this.payment = { ...this.oldPayment };
				}
			},

			resetModal() {
				let zeroFill = (v) => (+v < 10 ? `0${v}` : v);

				let [m, d, y] = new Date().toLocaleDateString().split("/");

				const today = `${y}-${zeroFill(m)}-${zeroFill(d)}`;

				this.payment.amount = 0;
				this.payment.date = today;
				this.payment.payment_method = PAYMENT_CASH;
				this.payment.note = null;

				this.$store.commit(`${this.namespace}/setOldPayment`, null);

				this.$nextTick(this.$v.$reset);
			}
		}
	};
</script>

<style scoped lang="scss">
	.payment-info {
		height: calc(1.5em + 0.75rem + 2px);
		padding: 0.375rem 1.75rem 0.375rem 0.75rem;
		// background-color: #e9ecef;
		// border: 1px solid #ced4da;
		border-radius: 0.25rem;
	}
</style>
