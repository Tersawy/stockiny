<template>
	<div>
		<b-row cols="1" cols-md="2" cols-lg="3" class="order-info my-4">
			<b-col>
				<h6 class="fs-14 text-muted mb-1">Customer</h6>
				<h6 class="fs-14 mb-1">{{ sale.customer.name | toSentenceCase }}</h6>
				<div class="fs-14">{{ sale.customer.address }}</div>
				<div class="fs-14">{{ sale.customer.city }} - {{ sale.customer.country }}</div>
				<div class="fs-14">{{ sale.customer.zipCode }}</div>
				<div class="fs-14">{{ sale.customer.phone }}</div>
				<div class="fs-14">{{ sale.customer.email }}</div>
			</b-col>
			<hr style="width: 96%" class="d-md-none d-print-none" />
			<b-col>
				<h6 class="fs-14 text-muted mb-1">Warehouse</h6>
				<h6 class="fs-14 mb-1">{{ sale.warehouse.name | toSentenceCase }}</h6>
				<div class="fs-14">{{ sale.warehouse.address }}</div>
				<div class="fs-14">{{ sale.warehouse.city }} - {{ sale.warehouse.country }}</div>
				<div class="fs-14">{{ sale.warehouse.zipCode }}</div>
				<div class="fs-14">{{ sale.warehouse.phone }}</div>
				<div class="fs-14">{{ sale.warehouse.email }}</div>
			</b-col>
			<hr class="col-11 col-md-11 d-lg-none d-print-none" />
			<b-col cols="12" md="12">
				<b-row cols="2" class="text-nowrap">
					<b-col class="mb-1 text-lg-right">
						<h6 class="fs-14 mb-0">#Reference:&nbsp;</h6>
					</b-col>
					<b-col class="mb-1">
						<span>{{ sale.reference }}</span>
					</b-col>
					<b-col class="mb-1 text-lg-right">
						<h6 class="fs-14 mb-0">Date:&nbsp;</h6>
					</b-col>
					<b-col class="mb-1">
						<DateStr v-if="sale.date" :date="sale.date" />
					</b-col>
					<b-col class="mb-1 text-lg-right">
						<h6 class="fs-14 mb-0">Status:</h6>
					</b-col>
					<b-col class="mb-1">
						<span v-if="!sale.status || typeof sale.status == 'string'"> - - -</span>
						<InvoiceStatus v-else :status="sale.status" />
					</b-col>
					<b-col class="mb-1 text-lg-right">
						<h6 class="fs-14 mb-0">Requested at:</h6>
					</b-col>
					<b-col class="mb-1">
						<DateStr v-if="sale.createdAt" :date="sale.createdAt" />
					</b-col>
					<b-col class="mb-1 text-lg-right">
						<h6 class="fs-14 mb-0">Requested by:</h6>
					</b-col>
					<b-col class="mb-1">
						<span v-if="sale.createdBy">{{ sale.createdBy.fullname }}</span>
					</b-col>
				</b-row>
			</b-col>
		</b-row>
		<b-table :fields="fields" show-empty :items="payments"> </b-table>
	</div>
</template>

<script>
import { getDate } from "@/helpers";

const DateStr = () => import("@/components/DateStr");

const InvoiceStatus = () => import("@/components/InvoiceStatus");

export default {
	props: { paymentId: { type: String, default: null } },

	components: { DateStr, InvoiceStatus },

	data() {
		return {
			fields: [{ key: "date", label: "Date", formatter: getDate }, "reference", "amount", { key: "paymentType", label: "Paid By" }]
		};
	},

	computed: {
		sale() {
			return this.$store.state.Sales.one;
		},

		payments() {
			if (this.paymentId) {
				let payment = this.sale?.payments?.find((payment) => payment._id === this.paymentId);

				if (payment) return [payment];

				return [];
			}

			return this.sale?.payments || [];
		}
	}
};
</script>