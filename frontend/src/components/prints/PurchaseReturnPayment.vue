<template>
	<div>
		<b-row cols="1" cols-md="2" cols-lg="3" class="order-info my-4">
			<b-col>
				<h6 class="fs-14 text-muted mb-1">Supplier</h6>
				<h6 class="fs-14 mb-1">{{ purchaseReturn.supplier.name | toSentenceCase }}</h6>
				<div class="fs-14">{{ purchaseReturn.supplier.address }}</div>
				<div class="fs-14">{{ purchaseReturn.supplier.city }} - {{ purchaseReturn.supplier.country }}</div>
				<div class="fs-14">{{ purchaseReturn.supplier.zipCode }}</div>
				<div class="fs-14">{{ purchaseReturn.supplier.phone }}</div>
				<div class="fs-14">{{ purchaseReturn.supplier.email }}</div>
			</b-col>
			<hr style="width: 96%" class="d-md-none d-print-none" />
			<b-col>
				<h6 class="fs-14 text-muted mb-1">Warehouse</h6>
				<h6 class="fs-14 mb-1">{{ purchaseReturn.warehouse.name | toSentenceCase }}</h6>
				<div class="fs-14">{{ purchaseReturn.warehouse.address }}</div>
				<div class="fs-14">{{ purchaseReturn.warehouse.city }} - {{ purchaseReturn.warehouse.country }}</div>
				<div class="fs-14">{{ purchaseReturn.warehouse.zipCode }}</div>
				<div class="fs-14">{{ purchaseReturn.warehouse.phone }}</div>
				<div class="fs-14">{{ purchaseReturn.warehouse.email }}</div>
			</b-col>
			<hr class="col-11 col-md-11 d-lg-none d-print-none" />
			<b-col cols="12" md="12">
				<b-row cols="2" class="text-nowrap">
					<b-col class="mb-1 text-lg-right">
						<h6 class="fs-14 mb-0">#Reference:&nbsp;</h6>
					</b-col>
					<b-col class="mb-1">
						<span>{{ purchaseReturn.reference }}</span>
					</b-col>
					<b-col class="mb-1 text-lg-right">
						<h6 class="fs-14 mb-0">Date:&nbsp;</h6>
					</b-col>
					<b-col class="mb-1">
						<DateStr v-if="purchaseReturn.date" :date="purchaseReturn.date" />
					</b-col>
					<b-col class="mb-1 text-lg-right">
						<h6 class="fs-14 mb-0">Status:</h6>
					</b-col>
					<b-col class="mb-1">
						<span v-if="!purchaseReturn.status || typeof purchaseReturn.status == 'string'"> - - -</span>
						<InvoiceStatus v-else :status="purchaseReturn.status" />
					</b-col>
					<b-col class="mb-1 text-lg-right">
						<h6 class="fs-14 mb-0">Requested at:</h6>
					</b-col>
					<b-col class="mb-1">
						<DateStr v-if="purchaseReturn.createdAt" :date="purchaseReturn.createdAt" />
					</b-col>
					<b-col class="mb-1 text-lg-right">
						<h6 class="fs-14 mb-0">Requested by:</h6>
					</b-col>
					<b-col class="mb-1">
						<span v-if="purchaseReturn.createdBy">{{ purchaseReturn.createdBy.fullname }}</span>
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
		purchaseReturn() {
			return this.$store.state.PurchasesReturn.one;
		},

		payments() {
			if (this.paymentId) {
				let payment = this.purchaseReturn?.payments?.find((payment) => payment._id === this.paymentId);

				if (payment) return [payment];

				return [];
			}

			return this.purchaseReturn?.payments || [];
		}
	}
};
</script>