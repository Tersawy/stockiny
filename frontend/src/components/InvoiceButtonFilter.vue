<template>
	<b-dropdown :variant="dropdownVariant" class="filter-dropdown" no-caret menu-class="custom-menu shadow" right @hide="hide" @toggle="toggle" ref="filterDropdown">
		<template #button-content>
			<FilterIcon />
			<span class="d-none d-sm-inline ml-1">Filter</span>
		</template>

		<b-overlay :show="isBusy" opacity="0.6" spinner-variant="primary">
			<slot name="default">
				<b-dropdown-form>
					<!-- Date -->
					<b-form-group label-for="date" label="Choose a date">
						<BFormDatepicker id="date" v-model="filter.date" offset="-34" reset-button reset-value="Reset" hideHeader menu-class="shadow" />
					</b-form-group>

					<!-- Status -->
					<b-form-group label-for="status" label="Status">
						<BFormSelect id="status" v-model="filter.status" :options="statusesOptions" text-field="name" value-field="_id" />
					</b-form-group>

					<!-- Payment Status -->
					<b-form-group label-for="paymentStatus" label="Payment status">
						<BFormSelect id="paymentStatus" v-model="filter.paymentStatus" :options="paymentStatuses" />
					</b-form-group>

					<!-- Supplier -->
					<b-form-group label-for="supplier" label="Supplier" v-if="suppliers.length">
						<BFormSelect id="supplier" v-model="filter.supplier" :options="suppliersOptions" text-field="name" value-field="_id" />
					</b-form-group>

					<!-- Customer -->
					<b-form-group label-for="customer" label="Customer" v-if="customers.length">
						<BFormSelect id="customer" v-model="filter.customer" :options="customersOptions" text-field="name" value-field="_id" />
					</b-form-group>

					<!-- Warehouse -->
					<b-form-group label-for="warehouse" label="Warehouse">
						<BFormSelect id="warehouse" v-model="filter.warehouse" :options="warehousesOptions" text-field="name" value-field="_id" />
					</b-form-group>

					<div class="d-flex justify-content-end">
						<!-- Reset Button -->
						<b-button variant="outline-danger" size="sm" @click="reset" class="mx-2" :disabled="filterIsAvailable"> Reset </b-button>

						<!-- Submit -->
						<b-button variant="outline-primary" size="sm" :disabled="noDataChanged" @click="handleFilter"> Filter </b-button>
					</div>
				</b-dropdown-form>
			</slot>
		</b-overlay>
	</b-dropdown>
</template>

<script>
import FilterIcon from "@/components/icons/filter";

export default {
	props: {
		statuses: { type: Array, default: () => [] },
		suppliers: { type: Array, default: () => [] },
		customers: { type: Array, default: () => [] },
		warehouses: { type: Array, default: () => [] }
	},

	components: { FilterIcon },

	data() {
		return {
			filter: { date: "", reference: "", supplier: "", customer: "", warehouse: "", status: "", paymentStatus: "" },

			paymentStatuses: [
				{ text: "All", value: "" },
				{ text: this.$t("constants.Paid"), value: "paid" },
				{ text: this.$t("constants.Unpaid"), value: "unpaid" },
				{ text: this.$t("constants.Partial"), value: "partial" }
			],

			lastResult: null,

			prevented: false,

			isBusy: true
		};
	},

	mounted() {
		this.$emit("mounted", () => {
			this.isBusy = false;
		});
	},

	computed: {
		statusesOptions() {
			return [{ _id: "", name: "All" }, ...this.statuses.filter((v) => !v.disabled)];
		},

		suppliersOptions() {
			return [{ _id: "", name: "All" }, ...this.suppliers.filter((v) => !v.disabled)];
		},

		customersOptions() {
			return [{ _id: "", name: "All" }, ...this.customers.filter((v) => !v.disabled)];
		},

		warehousesOptions() {
			return [{ _id: "", name: "All" }, ...this.warehouses.filter((v) => !v.disabled)];
		},

		filterIsAvailable() {
			return Object.keys(this.filter).every((key) => this.filter[key] == "");
		},

		dropdownVariant() {
			return this.lastResult && !Object.keys(this.lastResult).every((key) => this.lastResult[key] == "") ? "danger" : "primary";
		},

		noDataChanged() {
			if (!this.lastResult) {
				return Object.keys(this.filter).every((key) => this.filter[key] == "");
			}

			return Object.keys(this.filter).every((key) => this.filter[key] == this.lastResult[key]);
		}
	},

	methods: {
		hide(evt) {
			if (this.prevented) evt.preventDefault();
		},

		toggle() {
			this.prevented = !this.prevented;

			if (this.lastResult) {
				this.filter = Object.assign({}, this.lastResult);
				return;
			}

			for (let key in this.filter) {
				this.filter[key] = "";
			}
		},

		handleFilter() {
			this.isBusy = true;

			this.lastResult = Object.assign({}, this.filter);

			this.$emit("filter", this.filter, () => {
				this.isBusy = false;
			});
		},

		reset() {
			this.filter = { date: "", reference: "", supplier: "", customer: "", warehouse: "", status: "", paymentStatus: "" };

			if (!this.lastResult) return; // No need to reset if there is no last result to prevent sending a new request to the server with the same empty filter

			this.handleFilter();

			this.lastResult = null;
		}
	}
};
</script>

<style lang="scss">
.filter-dropdown {
	& > button {
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}
}
.search-input {
	& > input {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
		border-right: 0;
	}
}
</style>