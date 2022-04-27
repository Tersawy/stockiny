<template>
	<main-content :breads="breads">
		<b-row v-if="purchase && purchase._id">
			<b-col>
				<b-card>
					<b-row>
						<b-col>
							<h6 class="fs-14 text-muted mb-1">Supplier</h6>
							<h6 class="fs-14 mb-1">{{ purchase.supplier.name | toSentenceCase }}</h6>
							<div class="fs-14">{{ purchase.supplier.address }}</div>
							<div class="fs-14">{{ purchase.supplier.city }} - {{ purchase.supplier.country }}</div>
							<div class="fs-14">{{ purchase.supplier.zipCode }}</div>
							<div class="fs-14">{{ purchase.supplier.phone }}</div>
							<div class="fs-14">{{ purchase.supplier.email }}</div>
						</b-col>
						<b-col>
							<h6 class="fs-14 text-muted mb-1">Warehouse</h6>
							<h6 class="fs-14 mb-1">{{ purchase.warehouse.name | toSentenceCase }}</h6>
							<div class="fs-14">{{ purchase.warehouse.address }}</div>
							<div class="fs-14">{{ purchase.warehouse.city }} - {{ purchase.warehouse.country }}</div>
							<div class="fs-14">{{ purchase.warehouse.zipCode }}</div>
							<div class="fs-14">{{ purchase.warehouse.phone }}</div>
							<div class="fs-14">{{ purchase.warehouse.email }}</div>
						</b-col>
						<b-col>
							<b-row cols="2">
								<b-col class="mb-1 text-right">
									<h6 class="fs-14 mb-0">#Reference:&nbsp;</h6>
								</b-col>
								<b-col>
									<span>{{ purchase.reference }}</span>
								</b-col>
								<b-col class="mb-1 text-right">
									<h6 class="fs-14 mb-0">Date:&nbsp;</h6>
								</b-col>
								<b-col>
									<DateStr :date="purchase.date" />
								</b-col>
								<b-col class="mb-1 text-right">
									<h6 class="fs-14 mb-0">Status:</h6>
								</b-col>
								<b-col>
									<InvoiceStatus :status="purchase.status" />
								</b-col>
								<b-col class="mb-1 text-right">
									<h6 class="fs-14 mb-0">Requested at:</h6>
								</b-col>
								<b-col>
									<DateStr :date="purchase.createdAt" />
								</b-col>
								<b-col class="mb-1 text-right">
									<h6 class="fs-14 mb-0">Requested by:</h6>
								</b-col>
								<b-col>
									<span>{{ purchase.createdBy.fullname }}</span>
								</b-col>
							</b-row>
						</b-col>
					</b-row>
				</b-card>
			</b-col>
		</b-row>
	</main-content>
</template>

<script>
import axios from "@/plugins/axios";

const DateStr = () => import("@/components/DateStr");

const InvoiceStatus = () => import("@/components/ui/InvoiceStatus");

export default {
	components: { DateStr, InvoiceStatus },
	data() {
		return {};
	},

	async beforeRouteEnter(to, from, next) {
		let res = await axios.get(`/purchases/${to.params.id}`);

		next((vm) => {
			vm.$store.commit("Purchases/setOne", res.doc);
		});
	},

	computed: {
		purchase() {
			return this.$store.state.Purchases.one;
		},

		breads() {
			return [{ title: "Dashboard", link: "/" }, { title: "Purchases", link: "/purchases" }, { title: this.purchase.reference }];
		}
	}
};
</script>

<style lang="scss">
.fs-14 {
	font-size: 14px;
	line-height: 1.7;
}
</style>