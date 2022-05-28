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
				<router-link class="btn btn-outline-success btn-sm ml-2" :to="{ name: 'TransferEdit', params: { id: $route.params.id } }">
					<div class="d-flex align-items-center">
						<EditIcon scale="0.67" width="17px" height="17px" />
						<span class="ml-1">Edit</span>
					</div>
				</router-link>
			</div>
		</template>

		<Transfer />
	</main-content>
</template>

<script>
import axios from "@/plugins/axios";

const Transfer = () => import("@/components/Transfer");

import PrinterIcon from "@/components/icons/printer";

import EditIcon from "@/components/icons/edit";

export default {
	components: { Transfer, PrinterIcon, EditIcon },

	async beforeRouteEnter(to, from, next) {
		let res = await axios.get(`/transfers/${to.params.id}`);

		next((vm) => {
			vm.$store.commit("Transfers/setOne", res.doc);
		});
	},

	computed: {
		breads() {
			return [{ title: "Dashboard", link: "/" }, { title: "Transfers", link: "/transfers" }, { title: this.transfer.reference }];
		},

		transfer() {
			return this.$store.state.Transfers.one;
		}
	},

	methods: {
		print() {
			window.print();
		}
	}
};
</script>
