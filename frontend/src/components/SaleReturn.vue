<template>
	<b-row v-if="saleReturn && saleReturn._id">
		<b-col>
			<b-card>
				<b-row>
					<b-col cols="12" class="mb-4">
						<PrintHeader />
					</b-col>
				</b-row>
				<b-row cols="1" cols-md="2" cols-lg="3" class="order-info">
					<b-col>
						<h6 class="fs-14 text-muted mb-1">Customer</h6>
						<h6 class="fs-14 mb-1">{{ saleReturn.customer.name | toSentenceCase }}</h6>
						<div class="fs-14">{{ saleReturn.customer.address }}</div>
						<div class="fs-14">{{ saleReturn.customer.city }} - {{ saleReturn.customer.country }}</div>
						<div class="fs-14">{{ saleReturn.customer.zipCode }}</div>
						<div class="fs-14">{{ saleReturn.customer.phone }}</div>
						<div class="fs-14">{{ saleReturn.customer.email }}</div>
					</b-col>
					<hr style="width: 96%" class="d-md-none d-print-none" />
					<b-col>
						<h6 class="fs-14 text-muted mb-1">Warehouse</h6>
						<h6 class="fs-14 mb-1">{{ saleReturn.warehouse.name | toSentenceCase }}</h6>
						<div class="fs-14">{{ saleReturn.warehouse.address }}</div>
						<div class="fs-14">{{ saleReturn.warehouse.city }} - {{ saleReturn.warehouse.country }}</div>
						<div class="fs-14">{{ saleReturn.warehouse.zipCode }}</div>
						<div class="fs-14">{{ saleReturn.warehouse.phone }}</div>
						<div class="fs-14">{{ saleReturn.warehouse.email }}</div>
					</b-col>
					<hr class="col-11 col-md-11 d-lg-none d-print-none" />
					<b-col cols="12" md="12">
						<b-row cols="2" class="text-nowrap">
							<b-col class="mb-1 text-lg-right">
								<h6 class="fs-14 mb-0">#Reference:&nbsp;</h6>
							</b-col>
							<b-col class="mb-1">
								<span>{{ saleReturn.reference }}</span>
							</b-col>
							<b-col class="mb-1 text-lg-right">
								<h6 class="fs-14 mb-0">Date:&nbsp;</h6>
							</b-col>
							<b-col class="mb-1">
								<DateStr v-if="saleReturn.date" :date="saleReturn.date" />
							</b-col>
							<b-col class="mb-1 text-lg-right">
								<h6 class="fs-14 mb-0">Status:</h6>
							</b-col>
							<b-col class="mb-1">
								<span v-if="!saleReturn.status || typeof saleReturn.status == 'string'"> - - -</span>
								<InvoiceStatus v-else :status="saleReturn.status" />
							</b-col>
							<b-col class="mb-1 text-lg-right">
								<h6 class="fs-14 mb-0">Requested at:</h6>
							</b-col>
							<b-col class="mb-1">
								<DateStr v-if="saleReturn.createdAt" :date="saleReturn.createdAt" />
							</b-col>
							<b-col class="mb-1 text-lg-right">
								<h6 class="fs-14 mb-0">Requested by:</h6>
							</b-col>
							<b-col class="mb-1">
								<span v-if="saleReturn.createdBy">{{ saleReturn.createdBy.fullname }}</span>
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
										<span class="text-nowrap"> ( {{ saleReturn.tax | floating }}% ) </span>
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
									<td>$ {{ saleReturn.shipping | floating }}</td>
								</tr>
								<tr>
									<td class="font-weight-600 pr-0">Order Total</td>
									<td class="font-weight-600 text-primary">$ {{ orderTotal | floating }}</td>
								</tr>
								<tr>
									<td class="font-weight-400 pr-0">Paid</td>
									<td>$ {{ saleReturn.paid | floating }}</td>
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

const InvoiceStatus = () => import("@/components/InvoiceStatus");

const PrintHeader = () => import("@/components/prints/layout/PrintHeader");

export default {
	props: {
		invoice: { type: Object, default: () => {} }
	},

	components: { PrintHeader, DateStr, InvoiceStatus },

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
		saleReturn() {
			return this.$store.state.SalesReturn.one;
		},

		details() {
			if (!this.saleReturn.details) return [];

			return this.saleReturn.details.map((item) => {
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
			let discount = +this.saleReturn.discount || 0;

			if (!discount) return 0;

			let isFixed = this.saleReturn.discountMethod == "fixed";

			if (isFixed) return discount;

			discount = discount * (this.totalAmountOfSubtotal / 100);

			return discount;
		},

		discountPercent() {
			let discount = +this.saleReturn.discount || 0;

			if (!discount) return 0;

			let isPercent = this.saleReturn.discountMethod == "percent";

			if (isPercent) return discount;

			discount = discount / (this.totalAmountOfSubtotal / 100);

			return discount;
		},

		totalPriceWithoutDiscount() {
			return this.totalAmountOfSubtotal - this.discountFixed;
		},

		taxFixed() {
			let tax = +this.saleReturn.tax || 0;

			if (!tax) return 0;

			tax = this.totalPriceWithoutDiscount * (tax / 100);

			return tax;
		},

		orderTotal() {
			return this.totalPriceWithoutDiscount + this.taxFixed + +this.saleReturn.shipping;
		},

		due() {
			return this.orderTotal - +this.saleReturn.paid;
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