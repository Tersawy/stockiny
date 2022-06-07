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
				<router-link class="btn btn-outline-success btn-sm ml-2" :to="{ name: 'AdjustmentEdit', params: { id: $route.params.id } }">
					<div class="d-flex align-items-center">
						<EditIcon scale="0.67" width="17px" height="17px" />
						<span class="ml-1">Edit</span>
					</div>
				</router-link>
			</div>
		</template>

		<Adjustment />
	</main-content>
</template>

<script>
import axios from "@/plugins/axios";

const Adjustment = () => import("@/components/Adjustment");

import PrinterIcon from "@/components/icons/printer";

import EditIcon from "@/components/icons/edit";

export default {
	components: { Adjustment, PrinterIcon, EditIcon },

	async beforeRouteEnter(to, from, next) {
		let res = await axios.get(`/adjustments/${to.params.id}`);

		next((vm) => {
			vm.$store.commit("Adjustments/setOne", res.doc);
		});
	},

	computed: {
		breads() {
			return [{ title: "Dashboard", link: "/" }, { title: "Adjustments", link: "/adjustments" }, { title: this.adjustment.reference }];
		},

		adjustment() {
			return this.$store.state.Adjustments.one;
		}
	},

	methods: {
		print() {
			window.print();
		}
	}
};
</script>
