<template>
	<b-row v-if="adjustment && adjustment._id">
		<b-col>
			<b-card>
				<b-row>
					<b-col cols="12" class="mb-4">
						<PrintHeader />
					</b-col>
				</b-row>
				<b-row cols="1" cols-md="2" class="order-info" align-h="center">
					<b-col>
						<h6 class="fs-14 text-muted mb-1">Warehouse</h6>
						<h6 class="fs-14 mb-1">{{ adjustment.warehouse.name | toCapitalize }}</h6>
						<div class="fs-14">{{ adjustment.warehouse.address | toCapitalize }}</div>
						<div class="fs-14">{{ adjustment.warehouse.city | toCapitalize }} - {{ adjustment.warehouse.country | toCapitalize }}</div>
						<div class="fs-14">{{ adjustment.warehouse.zipCode }}</div>
						<div class="fs-14">{{ adjustment.warehouse.phone }}</div>
						<div class="fs-14">{{ adjustment.warehouse.email }}</div>
					</b-col>
					<hr class="col-11 col-md-11 d-lg-none d-print-none" />
					<b-col>
						<b-row cols="2" class="text-nowrap">
							<b-col class="mb-1 text-lg-right">
								<h6 class="fs-14 mb-0">#Reference:&nbsp;</h6>
							</b-col>
							<b-col class="mb-1">
								<span>{{ adjustment.reference }}</span>
							</b-col>
							<b-col class="mb-1 text-lg-right">
								<h6 class="fs-14 mb-0">Date:&nbsp;</h6>
							</b-col>
							<b-col class="mb-1">
								<DateStr v-if="adjustment.date" :date="adjustment.date" />
							</b-col>
							<b-col class="mb-1 text-lg-right">
								<h6 class="fs-14 mb-0">Status:</h6>
							</b-col>
							<b-col class="mb-1">
								<span v-if="!adjustment.status || typeof adjustment.status == 'string'"> - - -</span>
								<InvoiceStatus v-else :status="adjustment.status" />
							</b-col>
							<b-col class="mb-1 text-lg-right">
								<h6 class="fs-14 mb-0">Requested at:</h6>
							</b-col>
							<b-col class="mb-1">
								<DateStr v-if="adjustment.createdAt" :date="adjustment.createdAt" />
							</b-col>
							<b-col class="mb-1 text-lg-right">
								<h6 class="fs-14 mb-0">Requested by:</h6>
							</b-col>
							<b-col class="mb-1">
								<span v-if="adjustment.createdBy">{{ adjustment.createdBy.fullname | toCapitalize }}</span>
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
									<strong>{{ item.product.name | toCapitalize }}</strong>
									<small class="text-nowrap text-muted"> ( {{ item.variant.name | toCapitalize }} ) </small>
								</div>

								<b-badge variant="outline-info" class="mb-2"> {{ item.product.code | toCapitalize }} </b-badge>
							</template>

							<template #cell(subUnit)="{ item }">
								{{ item.subUnit.name | toCapitalize }}
							</template>
						</b-table>
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

				{ key: "type", label: "Type", class: "text-center" },

				{ key: "quantity", label: "Quantity", class: "text-center" },

				{ key: "subUnit", label: "Unit", class: "text-center" }
			]
		};
	},

	computed: {
		adjustment() {
			return this.$store.state.Adjustments.one;
		},

		details() {
			if (!this.adjustment.details) return [];

			return this.adjustment.details.map((item) => {
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
			let discount = +this.adjustment.discount || 0;

			if (!discount) return 0;

			let isFixed = this.adjustment.discountMethod == "fixed";

			if (isFixed) return discount;

			discount = discount * (this.totalAmountOfSubtotal / 100);

			return discount;
		},

		discountPercent() {
			let discount = +this.adjustment.discount || 0;

			if (!discount) return 0;

			let isPercent = this.adjustment.discountMethod == "percent";

			if (isPercent) return discount;

			discount = discount / (this.totalAmountOfSubtotal / 100);

			return discount;
		},

		totalPriceWithoutDiscount() {
			return this.totalAmountOfSubtotal - this.discountFixed;
		},

		taxFixed() {
			let tax = +this.adjustment.tax || 0;

			if (!tax) return 0;

			tax = this.totalPriceWithoutDiscount * (tax / 100);

			return tax;
		},

		orderTotal() {
			return this.totalPriceWithoutDiscount + this.taxFixed + +this.adjustment.shipping;
		},

		due() {
			return this.orderTotal - +this.adjustment.paid;
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