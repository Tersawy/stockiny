<template>
	<b-modal id="payments" hide-footer size="lg" body-class="pt-0">
		<template #modal-header="{ close }">
			<div class="d-flex align-items-center justify-content-between w-100">
				<div class="d-flex align-items-center">
					<h6 class="mb-0">Show Payments:&nbsp;</h6>
					<b-badge variant="outline-primary" class="font-weight-500">{{ invoice.reference }}</b-badge>
				</div>
				<b-button size="sm" variant="outline-danger" @click="close()"> Close </b-button>
			</div>
		</template>
		<b-table :fields="fields" :items="invoice.payments" show-empty emptyText="There are no payments to show" class="mb-0" thead-tr-class="border-0">
			<template #empty="scope">
				<div class="text-center text-muted">
					<span>{{ scope.emptyText }},&nbsp;</span>
					<a href="#" class="font-weight-400" @click="$bvModal.show('paymentForm')">Create Payment</a>
				</div>
			</template>

			<template #cell(actions)="row">
				<div class="h4 mb-0">
					<b-icon icon="printer" variant="secondary" class="c-pointer" v-b-tooltip.hover="'Print'" @click="print(row.item)" />

					<b-icon icon="chat-dots" variant="warning" class="c-pointer mx-2" v-b-tooltip.hover="'Send To Sms'" @click="sendSms(row.item)" />

					<b-icon icon="envelope" variant="info" class="c-pointer" v-b-tooltip.hover="'Send To Email'" @click="sendEmail(row.item)" />

					<b-icon icon="pencil-square" variant="success" class="c-pointer mx-2" v-b-tooltip.hover="'Edit'" @click="edit(row.item)" />

					<b-icon icon="trash" variant="danger" class="c-pointer" v-b-tooltip.hover="'Delete'" @click="remove(row.item)" />
				</div>
			</template>
			<template #cell(payment_method)="row">{{ row.value | paymentMethod }}</template>

			<template #cell(amount)="row">
				<span class="text-primary">$ {{ row.value | floating }}</span>
			</template>
		</b-table>
	</b-modal>
</template>

<script>
	export default {
		props: ["namespace"],

		data() {
			return {
				fields: [
					{ key: "date", label: "Date" },
					{ key: "reference", label: "Reference" },
					{ key: "amount", label: "Amount" },
					{ key: "payment_method", label: "Paid By" },
					{ key: "actions", label: "Actions" }
				]
			};
		},

		computed: {
			invoice() {
				return this.$store.state[this.namespace].one;
			}
		},
		methods: {
			print() {},
			sendSms() {},
			sendEmail() {},
			edit(payment) {
				this.$store.commit(`${this.namespace}/setOldPayment`, { ...payment });

				this.$nextTick(() => {
					this.$bvModal.show("paymentForm");
				});
			},
			remove(payment) {
				this.$store.dispatch(`${this.namespace}/removePayment`, payment);
			}
		}
	};
</script>
