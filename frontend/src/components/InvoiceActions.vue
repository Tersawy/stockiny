<template>
	<div>
		<b-icon @click="$refs[invoice.reference].show()" icon="three-dots-vertical" scale="1.5" class="c-pointer"></b-icon>

		<b-dropdown size="sm" variant="link" class="dropdown-invoice-options" menu-class="py-0" no-caret :ref="invoice.reference" right>
			<template #button-content> </template>
			<b-dropdown-item link-class="p-0">
				<router-link :to="{ name: `${invoiceName}`, params: { id: invoice._id } }" class="py-2 px-4 d-flex align-items-center text-decoration-none">
					<b-icon icon="eye" scale="0.8"></b-icon>
					<span class="mx-2 text-muted">Show Details</span>
				</router-link>
			</b-dropdown-item>

			<b-dropdown-item link-class="p-0">
				<router-link :to="{ name: `${invoiceName}Edit`, params: { id: invoice._id } }" class="py-2 px-4 d-flex align-items-center text-decoration-none">
					<b-icon icon="pencil-square" scale="0.8"></b-icon>
					<span class="mx-2 text-muted">Edit {{ invoiceName }}</span>
				</router-link>
			</b-dropdown-item>

			<b-dropdown-item link-class="py-2 d-flex align-items-center" @click="showPayments(invoice)">
				<b-icon icon="credit-card" scale="0.8"></b-icon>
				<span class="mx-2 text-muted">Show Payments</span>
			</b-dropdown-item>

			<b-dropdown-item link-class="py-2 d-flex align-items-center" @click="setOne(invoice)" v-b-modal.paymentForm>
				<b-icon icon="plus-circle" scale="0.8"></b-icon>
				<span class="mx-2 text-muted">Create Payment</span>
			</b-dropdown-item>

			<b-dropdown-item link-class="py-2 d-flex align-items-center">
				<span class="d-flex" style="font-size: 13px">
					<i class="far fa-file-pdf fa-fw font-weight-300"></i>
				</span>
				<span class="mx-2 text-muted">Download PDF</span>
			</b-dropdown-item>

			<b-dropdown-item link-class="py-2 d-flex align-items-center">
				<b-icon icon="envelope" scale="0.8"></b-icon>
				<span class="mx-2 text-muted">Send {{ invoiceName }} on Email</span>
			</b-dropdown-item>

			<hr class="m-0" />

			<b-dropdown-item link-class="py-2 d-flex align-items-center text-danger" @click="moveToTrash(invoice)">
				<b-icon icon="trash" scale="0.8"></b-icon>
				<span class="mx-2 text-muted">Delete {{ invoiceName }}</span>
			</b-dropdown-item>
		</b-dropdown>
	</div>
</template>

<script>
export default {
	props: ["invoice", "namespace", "invoiceName"],

	methods: {
		async showPayments(invoice) {
			this.setOne({ ...invoice, payments: [] }); // payments: [] to shown in Payments Component when data will render

			try {
				await this.$store.dispatch(`${this.namespace}/getPayments`);
				this.$bvModal.show("payments");
			} catch (err) {
				console.log(err);
			}
		},

		setOne(data) {
			this.$store.commit(`${this.namespace}/setOne`, data);
		},

		moveToTrash(item) {
			return this.$store.dispatch(`${this.namespace}/moveToTrash`, item);
		}
	}
};
</script>

<style lang="scss">
.dropdown-invoice-options {
	& > button {
		visibility: hidden;
		padding: 0;
	}
	.svg-inline--fa.fa-fw {
		width: 1.2em;
	}
	a {
		&,
		&:hover,
		&:focus,
		&:focus-visible,
		&:-webkit-any-link:focus-visible {
			color: #212529;
			text-decoration: none;
			outline-offset: 0;
			outline: 0;
		}
		&:active {
			background: #e9ecef;
		}
	}
}
</style>
