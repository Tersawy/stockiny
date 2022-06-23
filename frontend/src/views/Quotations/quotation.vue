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
				<router-link class="btn btn-outline-success btn-sm ml-2" :to="{ name: 'QuotationEdit', params: { id: $route.params.id } }">
					<div class="d-flex align-items-center">
						<EditIcon scale="0.67" width="17px" height="17px" />
						<span class="ml-1">Edit</span>
					</div>
				</router-link>
			</div>
		</template>

		<Quotation with-payments />
	</main-content>
</template>

<script>
import axios from "@/plugins/axios";

const Quotation = () => import("@/components/Quotation");

import PrinterIcon from "@/components/icons/printer";

import EditIcon from "@/components/icons/edit";

export default {
	components: { Quotation, PrinterIcon, EditIcon },

	async beforeRouteEnter(to, from, next) {
		let res = await axios.get(`/quotations/${to.params.id}`);

		next((vm) => {
			vm.$store.commit("Quotations/setOne", res.doc);
		});
	},

	computed: {
		breads() {
			return [{ title: "Dashboard", link: "/" }, { title: "Quotations", link: "/quotations" }, { title: this.quotation.reference }];
		},

		quotation() {
			return this.$store.state.Quotations.one;
		}
	},

	methods: {
		print() {
			window.print();
		}
	}
};
</script>
