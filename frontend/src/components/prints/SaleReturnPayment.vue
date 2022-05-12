<template>
	<div>
		<b-row cols="1" cols-md="2" cols-lg="3" class="order-info my-4">
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
		saleReturn() {
			return this.$store.state.SalesReturn.one;
		},

		payments() {
			if (this.paymentId) {
				let payment = this.saleReturn?.payments?.find((payment) => payment._id === this.paymentId);

				if (payment) return [payment];

				return [];
			}

			return this.saleReturn?.payments || [];
		}
	}
};
</script>