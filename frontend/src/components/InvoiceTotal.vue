<template>
	<table class="table table-striped mb-0">
		<tbody>
			<tr>
				<td class="border-0 font-weight-400 pr-0">Order Tax</td>
				<td class="border-0">
					<span>$ {{ invoiceTaxFixed | floating }} </span>
					<span class="text-nowrap"> ( {{ invoiceTaxPercent | floating }}% ) </span>
				</td>
			</tr>
			<tr>
				<td class="font-weight-400 pr-0">Discount</td>
				<td>
					<span>$ {{ invoiceDiscountFixed | floating }} </span>
					<span class="text-nowrap"> ( {{ invoiceDiscountPercent | floating }}% ) </span>
				</td>
			</tr>
			<tr>
				<td class="font-weight-400 pr-0">Shipping</td>
				<td>$ {{ invoiceShipping | floating }}</td>
			</tr>
			<tr>
				<td class="font-weight-600 pr-0">Total {{ amountType }}</td>
				<td class="font-weight-600 text-primary">$ {{ invoiceTotalAmount | floating }}</td>
			</tr>
		</tbody>
	</table>
</template>

<script>
	export default {
		props: ["invoice", "amountType"],

		computed: {
			invoiceDiscountFixed() {
				if (!+this.invoice.discount) return 0;

				let isFixed = this.invoice.discountMethod == "fixed";

				if (isFixed) return +this.invoice.discount;

				let dicountFixed = +this.invoice.discount * (this.totalAmountOfSubtotal / 100);

				return dicountFixed;
			},

			invoiceDiscountPercent() {
				if (!+this.invoice.discount) return 0;

				let isPercent = this.invoice.discountMethod == "percent";

				if (isPercent) return +this.invoice.discount;

				let discountPercent = +this.invoice.discount / (this.totalAmountOfSubtotal / 100);

				return discountPercent;
			},

			invoiceTaxPercent() {
				return +this.invoice.tax || 0;
			},

			invoiceTaxFixed() {
				if (!+this.invoice.tax) return 0;

				let totalPriceWithoutDiscount = this.totalAmountOfSubtotal - this.invoiceDiscountFixed;

				let invoiceTax = totalPriceWithoutDiscount * (+this.invoice.tax / 100);

				return invoiceTax;
			},

			invoiceShipping() {
				return +this.invoice.shipping || 0;
			},

			details() {
				return this.invoice.details;
			},

			totalAmountOfSubtotal() {
				if (!this.details.length) return 0;

				return +this.details.reduce((curr, d) => curr + (+d.subtotalUnitAmount || 0), 0) || 0;
			},

			invoiceTotalAmount() {
				let total = this.totalAmountOfSubtotal - this.invoiceDiscountFixed + this.invoiceShipping + this.invoiceTaxFixed;

				return total;
			}
		}
	};
</script>
