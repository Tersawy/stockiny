<template>
	<b-row v-if="purchase && purchase._id">
		<b-col>
			<b-card>
				<b-row>
					<b-col cols="12" class="mb-4">
						<div class="d-flex justify-content-between pb-3 border-bottom" style="border-width: 2px !important">
							<h1 class="mb-0 d-none d-md-block d-print-block">Locanos</h1>
							<div class="text-right w-100 text-center text-md-right text-print-right">
								<h1 class="font-weight-light">Purchase Order</h1>
								<h2 class="text-muted mb-1">Locanos</h2>
								<span class="text-muted fs-14">United States</span>
							</div>
						</div>
					</b-col>
				</b-row>
				<b-row cols="1" cols-md="2" cols-lg="3" class="order-info">
					<b-col>
						<h6 class="fs-14 text-muted mb-1">Supplier</h6>
						<h6 class="fs-14 mb-1">{{ purchase.supplier.name | toSentenceCase }}</h6>
						<div class="fs-14">{{ purchase.supplier.address }}</div>
						<div class="fs-14">{{ purchase.supplier.city }} - {{ purchase.supplier.country }}</div>
						<div class="fs-14">{{ purchase.supplier.zipCode }}</div>
						<div class="fs-14">{{ purchase.supplier.phone }}</div>
						<div class="fs-14">{{ purchase.supplier.email }}</div>
					</b-col>
					<hr style="width: 96%" class="d-md-none d-print-none" />
					<b-col>
						<h6 class="fs-14 text-muted mb-1">Warehouse</h6>
						<h6 class="fs-14 mb-1">{{ purchase.warehouse.name | toSentenceCase }}</h6>
						<div class="fs-14">{{ purchase.warehouse.address }}</div>
						<div class="fs-14">{{ purchase.warehouse.city }} - {{ purchase.warehouse.country }}</div>
						<div class="fs-14">{{ purchase.warehouse.zipCode }}</div>
						<div class="fs-14">{{ purchase.warehouse.phone }}</div>
						<div class="fs-14">{{ purchase.warehouse.email }}</div>
					</b-col>
					<hr class="col-11 col-md-11 d-lg-none d-print-none" />
					<b-col cols="12" md="12">
						<b-row cols="2" class="text-nowrap">
							<b-col class="mb-1 text-lg-right">
								<h6 class="fs-14 mb-0">#Reference:&nbsp;</h6>
							</b-col>
							<b-col class="mb-1">
								<span>{{ purchase.reference }}</span>
							</b-col>
							<b-col class="mb-1 text-lg-right">
								<h6 class="fs-14 mb-0">Date:&nbsp;</h6>
							</b-col>
							<b-col class="mb-1">
								<DateStr v-if="purchase.date" :date="purchase.date" />
							</b-col>
							<b-col class="mb-1 text-lg-right">
								<h6 class="fs-14 mb-0">Status:</h6>
							</b-col>
							<b-col class="mb-1">
								<span v-if="!purchase.status || typeof purchase.status == 'string'"> - - -</span>
								<InvoiceStatus v-else :status="purchase.status" />
							</b-col>
							<b-col class="mb-1 text-lg-right">
								<h6 class="fs-14 mb-0">Requested at:</h6>
							</b-col>
							<b-col class="mb-1">
								<DateStr v-if="purchase.createdAt" :date="purchase.createdAt" />
							</b-col>
							<b-col class="mb-1 text-lg-right">
								<h6 class="fs-14 mb-0">Requested by:</h6>
							</b-col>
							<b-col class="mb-1">
								<span v-if="purchase.createdBy">{{ purchase.createdBy.fullname }}</span>
							</b-col>
						</b-row>
					</b-col>
				</b-row>
				<b-row>
					<b-col cols="12" class="mt-4">
						<b-table head-variant="dark" class="shadow-sm text-nowrap" responsive bordered small :fields="fields" :items="details">
							<template #cell(index)="row">
								{{ row.index + 1 }}
							</template>
							<template #cell(name)="{ item }">
								<div class="mb-1">
									<strong>{{ item.name }}</strong>
									<small class="text-nowrap text-muted"> ( {{ item.variantName }} ) </small>
								</div>

								<b-badge variant="outline-info" class="mb-2"> {{ item.code }} </b-badge>

								<!-- <div class="d-flex align-items-center">
										<div class="font-weight-bold fs-14">{{ item.name }}</div>
										<div v-if="item.variantName">&nbsp;-&nbsp;{{ item.variantName }}</div>
									</div>
									<span> {{ item.code }} </span> -->
							</template>

							<template #cell(amount)="{ item }">
								<span class="ff-arial">$&nbsp;{{ item.netAmount | floating }}</span>
							</template>

							<template #cell(subUnit)="{ item }">
								{{ item.subUnit.name }}
							</template>

							<template #cell(tax)="{ item }">$&nbsp;{{ item.taxAmount | floating }} </template>

							<template #cell(discount)="{ item }">
								<span>$&nbsp;{{ item.discountAmount | floating }}</span>
							</template>

							<template #cell(total)="{ value }">
								<span class="font-weight-bold fs-14 ff-arial">$&nbsp;{{ value | floating }}</span>
							</template>
						</b-table>
					</b-col>
				</b-row>
				<b-row class="order-total justify-content-end mt-3">
					<b-col cols="12" md="6" lg="4">
						<table class="table table-striped mb-0 border shadow-sm">
							<tbody>
								<tr>
									<td class="border-0 font-weight-400 pr-0">Order Tax</td>
									<td class="border-0">
										<span>$ {{ taxFixed | floating }} </span>
										<span class="text-nowrap"> ( {{ purchase.tax | floating }}% ) </span>
									</td>
								</tr>
								<tr>
									<td class="font-weight-400 pr-0">Discount</td>
									<td>
										<span>$ {{ discountFixed | floating }} </span>
										<span class="text-nowrap"> ( {{ discountPercent | floating }}% ) </span>
									</td>
								</tr>
								<tr>
									<td class="font-weight-400 pr-0">Shipping</td>
									<td>$ {{ purchase.shipping | floating }}</td>
								</tr>
								<tr>
									<td class="font-weight-600 pr-0">Order Total</td>
									<td class="font-weight-600 text-primary">$ {{ orderTotal | floating }}</td>
								</tr>
								<tr>
									<td class="font-weight-400 pr-0">Paid</td>
									<td>$ {{ purchase.paid | floating }}</td>
								</tr>
								<tr>
									<td class="font-weight-600 pr-0">Due</td>
									<td class="font-weight-600 text-danger">$ {{ due | floating }}</td>
								</tr>
							</tbody>
						</table>
					</b-col>
				</b-row>
			</b-card>
		</b-col>
	</b-row>
</template>

<script>
const DateStr = () => import("@/components/DateStr");

const InvoiceStatus = () => import("@/components/ui/InvoiceStatus");

export default {
	props: {
		invoice: { type: Object, default: () => {} }
	},

	components: { DateStr, InvoiceStatus },

	data() {
		return {
			fields: [
				{ key: "index", label: "#", class: "text-center" },

				{ key: "name", label: "Name", class: "pl-3", tdClass: "bg-white" },

				{ key: "amount", label: "Amount", class: "text-center" },

				{ key: "quantity", label: "Quantity", class: "text-center" },

				{ key: "subUnit", label: "Unit", class: "text-center" },

				{ key: "discount", label: "Discount", class: "text-center" },

				{ key: "tax", label: "Tax", class: "text-center" },

				{ key: "total", label: "Total", class: "text-center" }
			]
		};
	},

	computed: {
		purchase() {
			return this.$store.state.Purchases.one;
		},

		details() {
			return this.purchase.details.map((item) => {
				return {
					...item,
					discountAmount: this.discountAmount(item),
					taxAmount: this.taxAmount(item),
					netAmount: this.netAmount(item)
				};
			});
		},

		totalAmountOfSubtotal() {
			return this.details.reduce((total, item) => total + +item.total, 0);
		},

		discountFixed() {
			let discount = +this.purchase.discount || 0;

			if (!discount) return 0;

			let isFixed = this.purchase.discountMethod == "fixed";

			if (isFixed) return discount;

			discount = discount * (this.totalAmountOfSubtotal / 100);

			return discount;
		},

		discountPercent() {
			let discount = +this.purchase.discount || 0;

			if (!discount) return 0;

			let isPercent = this.purchase.discountMethod == "percent";

			if (isPercent) return discount;

			discount = discount / (this.totalAmountOfSubtotal / 100);

			return discount;
		},

		totalPriceWithoutDiscount() {
			return this.totalAmountOfSubtotal - this.discountFixed;
		},

		taxFixed() {
			let tax = +this.purchase.tax || 0;

			if (!tax) return 0;

			tax = this.totalPriceWithoutDiscount * (tax / 100);

			return tax;
		},

		orderTotal() {
			return this.totalPriceWithoutDiscount + this.taxFixed + +this.purchase.shipping;
		},

		due() {
			return this.orderTotal - +this.purchase.paid;
		}
	},

	methods: {
		discountAmount(item) {
			let isFixed = item.discountMethod == "fixed";

			item.discount = +item.discount || 0;

			if (isFixed) return item.discount;

			return item.discount * (+item.amount / 100);
		},

		netAmount(item) {
			let amountExcludingDiscount = +item.amount - this.discountAmount(item);

			let isExclusive = item.taxMethod == "exclusive";

			if (isExclusive) return amountExcludingDiscount;

			item.tax = +item.tax || 0;

			let taxDivide = 1 + item.tax / 100;

			return amountExcludingDiscount / taxDivide;
		},

		taxAmount(item) {
			let amountExcludingDiscount = +item.amount - this.discountAmount(item);

			let isExclusive = item.taxMethod == "exclusive";

			if (isExclusive) {
				return (+item.tax || 0) * (amountExcludingDiscount / 100);
			}

			return amountExcludingDiscount - this.netAmount(item);
		},

		print() {
			window.print();
		}
	}
};
</script>

<style lang="scss">
.fs-14 {
	font-size: 14px;
	line-height: 1.7;
}
.ff-arial {
	font-family: "Arial";
}
.position-sticky {
	position: sticky;
	top: 0;
	z-index: 2;
	left: 0;
}
@media (min-width: 767px) {
	.position-sm-static {
		position: static !important;
	}
}
/* style sheet for "A4" printing */
@media print /* and (width: 21cm) and (height: 29.7cm) */ {
	.order-info {
		&.row > * {
			max-width: calc(100% / 3);
			flex: 0 0 calc(100% / 3);
		}
	}
	.order-total {
		&.row > * {
			max-width: calc(100% / 2);
			flex: 0 0 calc(100% / 2);
		}
	}
	.text-print-right {
		text-align: right !important;
	}
}

// /* style sheet for "letter" printing */
// @media print and (width: 8.5in) and (height: 11in) {
// 	@page {
// 		margin: 1in;
// 	}
// }
</style>