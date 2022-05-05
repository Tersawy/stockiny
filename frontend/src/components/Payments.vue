<template>
	<default-modal id="payments" :settings="{ showStayOpenBtn: false }" @ok="$bvModal.show('paymentForm')">
		<template #title>
			<div class="d-flex align-items-center">
				<h6 class="mb-0">Payments:&nbsp;</h6>
				<b-badge variant="outline-primary" style="font-size: 75%">{{ invoice.reference }}</b-badge>
			</div>
		</template>

		<template #ok> Create </template>

		<b-table stacked="md" :fields="fields" :items="invoice.payments" show-empty emptyText="There are no payments to show" class="mb-0" thead-tr-class="border-0">
			<template #empty="scope">
				<div class="text-center text-muted">
					<span>{{ scope.emptyText }},&nbsp;</span>
					<a href="#" class="font-weight-400" @click="$bvModal.show('paymentForm')">Create Payment</a>
				</div>
			</template>

			<template #cell(date)="{ value }"> <DateStr :date="value" /> </template>

			<template #cell(paymentType)="row">{{ row.value | toSentenceCase }}</template>

			<template #cell(amount)="row">
				<span class="text-primary">$ {{ row.value | floating }}</span>
			</template>

			<template #cell(actions)="row">
				<div class="h4 mb-0">
					<a class="text-secondary" v-b-tooltip.hover="'Print'" @click="print(row.item)"><PrinterIcon /></a>

					<a class="text-warning mx-2" v-b-tooltip.hover="'Send To Sms'" @click="sendSms(row.item)"><ChatDotsIcon /></a>

					<a class="text-info" v-b-tooltip.hover="'Send To Email'" @click="sendEmail(row.item)"><EnvelopeIcon /></a>

					<a class="text-success mx-2" v-b-tooltip.hover="'Edit'" @click="edit(row.item)"><EditIcon width="20px" height="20px" scale="0.65" /></a>

					<a class="text-danger" v-b-tooltip.hover="'Delete'" @click="showDeleteModal(row.item)"><TrashIcon width="20px" height="20px" scale="0.65" /></a>
				</div>
			</template>
		</b-table>
		<DeleteModal ref="deletePaymentModal" field="Payment" @ok="remove" />
	</default-modal>
</template>

<script>
import EnvelopeIcon from "@/components/icons/envelope";

import ChatDotsIcon from "@/components/icons/chatDots";

import PrinterIcon from "@/components/icons/printer";

import EditIcon from "@/components/icons/edit";

import TrashIcon from "@/components/icons/trash";

const DateStr = () => import("@/components/DateStr");

const DefaultModal = () => import("@/components/DefaultModal");

const DeleteModal = () => import("@/components/DeleteModal");

import { showMessage } from "@/components/utils";

export default {
	props: ["namespace"],

	components: { DateStr, DefaultModal, DeleteModal, EnvelopeIcon, ChatDotsIcon, PrinterIcon, EditIcon, TrashIcon },

	data() {
		return {
			fields: [
				{ key: "date", label: "Date" },
				{ key: "reference", label: "Reference" },
				{ key: "amount", label: "Amount" },
				{ key: "paymentType", label: "Paid By" },
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
		print(payment) {
			this.$emit("print", payment);
		},

		sendSms() {},
		sendEmail() {},
		edit(payment) {
			this.$store.commit(`${this.namespace}/setOldPayment`, { ...payment });

			this.$nextTick(() => this.$bvModal.show("paymentForm"));
		},
		async remove(payment) {
			this.$refs.deletePaymentModal.setBusy(true);

			try {
				await this.$store.dispatch(`${this.namespace}/removePayment`, payment);

				showMessage({ message: this.$t("messages.deleted") });
			} catch (error) {
				showMessage({ error: true });
			} finally {
				this.$refs.deletePaymentModal.close();
			}
		},

		showDeleteModal(payment) {
			this.$refs.deletePaymentModal.open(payment);
		}
	}
};
</script>

<style lang="scss">
@media (max-width: 991px) {
	#payments {
		.modal-dialog {
			max-width: 560px;
		}
	}
}
</style>