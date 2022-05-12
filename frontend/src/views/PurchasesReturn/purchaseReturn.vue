<template>
	<main-content :breads="breads">
		<template #end-breads>
			<div class="d-flex align-items-center">
				<!-- Print Button -->
				<b-button variant="outline-primary" size="sm" @click="print">
					<div class="d-flex align-items-center">
						<PrinterIcon scale="1" width="17px" height="17px" />
						<span class="ml-1">Print</span>
					</div>
				</b-button>

				<!-- Edit Button -->
				<router-link class="btn btn-outline-success btn-sm ml-2" :to="{ name: 'PurchaseReturnEdit', params: { id: $route.params.id } }">
					<div class="d-flex align-items-center">
						<EditIcon scale="0.67" width="17px" height="17px" />
						<span class="ml-1">Edit</span>
					</div>
				</router-link>
			</div>
		</template>

		<PurchaseReturn />
	</main-content>
</template>

<script>
import axios from "@/plugins/axios";

const PurchaseReturn = () => import("@/components/PurchaseReturn");

import PrinterIcon from "@/components/icons/printer";

import EditIcon from "@/components/icons/edit";

export default {
	components: { PurchaseReturn, PrinterIcon, EditIcon },

	async beforeRouteEnter(to, from, next) {
		let res = await axios.get(`/purchases-return/${to.params.id}`);

		next((vm) => {
			vm.$store.commit("PurchasesReturn/setOne", res.doc);
		});
	},

	computed: {
		breads() {
			return [{ title: "Dashboard", link: "/" }, { title: "Purchases Return", link: "/purchases-return" }, { title: this.purchaseReturn.reference }];
		},

		purchaseReturn() {
			return this.$store.state.PurchasesReturn.one;
		}
	},

	methods: {
		print() {
			window.print();
		}
	}
};
</script>
