<template>
	<main-content :breads="breads">
		<template #end-breads>
			<div class="d-flex align-items-center">
				<!-- Save Button -->
				<b-button variant="outline-primary" size="sm" @click="handleSave" :disabled="isBusy">
					Save
					<b-spinner v-if="isBusy" small class="mx-1"></b-spinner>
				</b-button>

				<!-- Cancel Button -->
				<b-button variant="outline-danger" size="sm" @click="handleCancel" :disabled="isBusy" class="ml-2"> Cancel </b-button>
			</div>
		</template>

		<b-form @submit.prevent="handleSave">
			<b-row>
				<b-col class="h-auto" cols="12">
					<b-card header="Adjustment Information" class="h-100">
						<b-row cols="1" cols-sm="3">
							<!--------------- Date Input --------------->
							<b-col>
								<default-date-picker-input label="Date" field="date" :vuelidate="$v.adjustment" namespace="Adjustments" />
							</b-col>

							<!--------------- Warehouse Input --------------->
							<b-col>
								<default-select label="Warehouse" field="warehouse" :options="warehouseOptions" :vuelidate="$v.adjustment" namespace="Adjustments" />
							</b-col>

							<!--------------- Status Input --------------->
							<b-col>
								<invoice-status-input :vuelidate="$v.adjustment" namespace="Adjustments" @mounted="setEffectedStatus" />
							</b-col>
						</b-row>
					</b-card>
				</b-col>

				<b-col cols="12" class="mt-4" order-lg="2">
					<!-- -------------Product Search------------- -->
					<b-card header="Adjustment Details">
						<invoice-auto-complete :options="productOptions" :selected="adjustment.details" :on-select="addToDetail" :is-busy="autoCompleteIsBusy" />
						<input-error :vuelidate-field="$v.adjustment.details" field="details" namespace="Adjustments" />

						<!-- This padding fix tr th border -->
						<div style="padding: 0 2px">
							<b-table
								:fields="fields"
								:items="adjustment.details"
								show-empty
								emptyText="There are no details to show"
								class="mb-0 invoice-details-table mt-3"
								responsive
								thead-class="text-nowrap"
								tbody-class="text-nowrap"
								stacked="lg"
							>
								<template #empty="scope">
									<div class="text-center text-muted">{{ scope.emptyText }}</div>
								</template>

								<template #cell(actions)="row">
									<a @click="removeDetail(row.index)" class="text-danger ml-3"><TrashIcon /></a>
								</template>

								<template #cell(image)="row">
									<b-avatar v-if="row.value" :src="`${BASE_URL}/images/products/${row.item.product}/${row.value}`" class="shadow-sm" rounded="lg"></b-avatar>
									<GalleryIcon v-else color="#999" style="width: 40px; height: 40px" />
								</template>

								<template #cell(name)="row">
									<div class="mb-2">
										<strong>{{ row.value | toCapitalize }}</strong>
										<small class="text-nowrap text-muted"> ( {{ row.item.variantName | toCapitalize }} ) </small>
									</div>

									<b-badge variant="outline-info"> {{ row.item.code }} </b-badge>
								</template>

								<template #cell(instockBySubUnit)="row">
									<!-- <b-badge :variant="row.item.stockVariant"> {{ row.value | floating }} {{ subUnit(row.item).shortName }} </b-badge> -->
									<b-btn :variant="row.item.stockVariant" size="sm" @click="changeSubUnit(row.item)" class="font-weight-bold">
										{{ row.value | floating }} {{ subUnit(row.item).shortName | toCapitalize }}
									</b-btn>
								</template>

								<template #cell(quantity)="row">
									<b-input-group style="width: 110px" class="mx-lg-auto">
										<b-input-group-prepend>
											<b-btn :variant="row.item.decrementBtn" size="sm" class="font-default" @click="decrementQuantity(row)"> - </b-btn>
										</b-input-group-prepend>

										<b-form-input
											class="border-0 shadow-none bg-light text-center"
											v-model.number="row.item.quantity"
											@change="quantityChanged(row, $event)"
											@focus="quantityInputFocused"
											ref="quantityInput"
										/>

										<b-input-group-append>
											<b-btn :variant="row.item.incrementBtn" size="sm" class="font-default" @click="incrementQuantity(row)"> + </b-btn>
										</b-input-group-append>
									</b-input-group>
								</template>

								<template #cell(type)="row">
									<b-btn :variant="typeVariant(row.item)" no-caret @click="toggleType(row.item)" size="sm" class="font-weight-bold">
										{{ row.value == "addition" ? "Addition ( + )" : "Subtraction ( - )" }}
									</b-btn>
								</template>
							</b-table>
						</div>
					</b-card>
				</b-col>

				<b-col class="mt-4" order="3">
					<!-- -------------Notes------------- -->
					<b-card header="Adjustment Notes">
						<default-text-area rows="4" class="mb-0" placeholder="Enter Adjustment Notes" field="notes" :vuelidate="$v.adjustment" namespace="Adjustments" />
					</b-card>
				</b-col>
			</b-row>
		</b-form>

		<default-modal
			id="quantityErrors"
			:showStayOpenBtn="false"
			:showOkBtn="false"
			title=""
			:modalProps="{ headerClass: 'py-3', centered: true, size: 'xl', class: 'w-100' }"
			class="w-100"
		>
			<template #btn-close="{ close }">
				<b-btn variant="outline-primary" size="sm" @click="close">Close</b-btn>
			</template>
			<b-table-simple hover small responsive bordered>
				<b-thead>
					<b-tr>
						<b-th rowspan="3" class="text-center" style="vertical-align: middle">Product</b-th>
						<b-th colspan="3" class="text-center">Warehouse</b-th>
						<b-th rowspan="3" class="text-center" style="vertical-align: middle">Quantity</b-th>
					</b-tr>
					<b-tr>
						<b-th rowspan="2" class="text-center" style="vertical-align: middle">Name</b-th>
						<b-th colspan="2" class="text-center">Stock</b-th>
					</b-tr>
					<b-tr>
						<b-th class="text-center">Before</b-th>
						<b-th class="text-center">After</b-th>
					</b-tr>
				</b-thead>
				<b-tbody>
					<b-tr v-for="(error, i) in quantityErrors" :key="i">
						<b-th>
							<div class="mb-2">
								<strong class="text-nowrap"> {{ error.product.name }} </strong>
								<small class="text-nowrap text-muted"> ( {{ error.variant.name }} ) </small>
							</div>
						</b-th>
						<b-td variant="danger" class="font-weight-bold text-center text-nowrap">{{ error.warehouse.name }}</b-td>
						<b-td class="text-center">
							<b-badge :variant="`outline-${error.warehouse.instock.after < 0 ? 'danger' : 'success'}`">
								{{ error.warehouse.instock.before | floating }} {{ error.unit.name }}
							</b-badge>
						</b-td>
						<b-td class="text-center">
							<b-badge :variant="`outline-${error.warehouse.instock.after < 0 ? 'danger' : 'success'}`">
								{{ error.warehouse.instock.after | floating }} {{ error.unit.name }}
							</b-badge>
						</b-td>
						<b-td class="text-center">
							<b-badge variant="outline-danger"> {{ error.quantity | floating }} {{ error.unit.name }} </b-badge>
						</b-td>
					</b-tr>
				</b-tbody>
			</b-table-simple>
		</default-modal>
	</main-content>
</template>

<script>
import { getDate } from "@/helpers";

const DefaultDatePickerInput = () => import("@/components/inputs/DefaultDatePickerInput");

const DefaultSelect = () => import("@/components/inputs/DefaultSelect");

const InvoiceStatusInput = () => import("@/components/inputs/InvoiceStatusInput");

const DefaultTextArea = () => import("@/components/inputs/DefaultTextArea");

const InvoiceAutoComplete = () => import("@/components/InvoiceAutoComplete");

const InputError = () => import("@/components/InputError");

const DefaultModal = () => import("@/components/DefaultModal");

import TrashIcon from "@/components/icons/trash";

import GalleryIcon from "@/components/icons/gallery";

import { mapActions, mapState } from "vuex";

import { required, minLength, maxLength } from "vuelidate/lib/validators";

import { validationMixin } from "vuelidate";

import { showMessage } from "@/components/utils";

export default {
	components: {
		DefaultDatePickerInput,
		DefaultSelect,
		InvoiceStatusInput,
		DefaultTextArea,
		InvoiceAutoComplete,
		InputError,
		DefaultModal,
		TrashIcon,
		GalleryIcon
	},

	mixins: [validationMixin],

	data() {
		let isEdit = this.$route.params.id;

		return {
			breads: [{ title: "Dashboard", link: "/" }, { title: "Adjustments", link: "/adjustments" }, { title: isEdit ? "Edit" : "Create" }],

			adjustment: { date: getDate(null, true), warehouse: null, status: null, notes: null, details: [] },

			quantityErrors: [],

			fields: [
				{ key: "image", label: "Image", tdClass: "text-lg-center", thClass: "text-lg-center" },
				{ key: "name", label: "Name" },
				{ key: "instockBySubUnit", label: "Instock", tdClass: "text-lg-center", thClass: "text-lg-center" },
				{ key: "quantity", label: "Quantity", tdClass: "text-lg-center", thClass: "text-lg-center" },
				{ key: "type", label: "Type", tdClass: "text-lg-center", thClass: "text-lg-center" },
				{ key: "actions", label: "Actions", tdClass: "text-lg-center", thClass: "text-lg-center" }
			],

			isBusy: false,

			autoCompleteIsBusy: false
		};
	},

	validations: {
		adjustment: {
			warehouse: { required },
			status: { required },
			notes: { maxLength: maxLength(255) },
			date: { required },
			details: { required, minLength: minLength(1) }
		}
	},

	async mounted() {
		this.getUnitsOptions();

		setTimeout(() => {
			// this.$bvModal.show("quantityErrors");
		}, 2000);

		if (this.isUpdate) {
			await Promise.all([this.getAdjustment(this.id), this.getWarehousesOpt()]);

			let breads = this.breads.splice(0, this.breads.length - 1); // remove last bread

			breads.push({ title: this.oldAdjustment.reference, link: { name: "Adjustment", params: { id: this.id } } });

			this.breads = [...breads, { title: "Edit" }];

			this.adjustment.date = getDate(this.oldAdjustment.date);
			this.adjustment.warehouse = this.oldAdjustment.warehouse;
			this.adjustment.status = this.oldAdjustment.status;

			setTimeout(() => this.oldAdjustment.details.forEach((detail) => this.addToDetail(detail, true)), 300);
		} else {
			this.getWarehousesOpt().then((data) => {
				if (!this.isUpdate) {
					if (data.options.length) {
						// TODO:: choise default warehouse from settings or user warehouse instead
						this.adjustment.warehouse = data.options[0]._id;
					}
				}
			});
		}
	},

	watch: {
		async "adjustment.warehouse"(warehouse) {
			if (warehouse) {
				this.adjustment.details = [];

				this.autoCompleteIsBusy = true;

				await this.getProductOptions({ warehouse });

				this.autoCompleteIsBusy = false;
			}
		}
	},

	computed: {
		...mapState({
			oldAdjustment: (s) => s.Adjustments.one,
			warehouseOptions: (s) => s.Warehouses.options,
			unitsOptions: (s) => s.Units.options
		}),

		productOptions() {
			return this.$store.getters["Products/options"]("adjustment", this.adjustment.warehouse);
		},

		id() {
			return this.$route.params.id;
		},

		isUpdate() {
			return !!this.id;
		}
	},

	methods: {
		...mapActions({
			getWarehousesOpt: "Warehouses/getOptions",
			getUnitsOptions: "Units/getOptions",
			create: "Adjustments/create",
			update: "Adjustments/update",
			getAdjustment: "Adjustments/getEdit"
		}),

		getProductOptions(payload) {
			return this.$store.dispatch("Products/getOptions", { ...payload, type: "adjustment" });
		},

		// ? emmited from InvoiceStatusInput after component got statuses from api
		// TODO:: it can be removed from that component when we make that fetch in this mount
		setEffectedStatus(effectedOption) {
			if (!this.isUpdate) {
				this.adjustment.status = effectedOption._id;
			}
		},

		addToDetail(product) {
			this.adjustment.details.push({
				image: product.image,
				product: product.product,
				code: product.code,
				name: product.name,
				variantId: product.variantId,
				variantName: product.variantName,
				subUnit: product.subUnit,
				unit: product.unit,
				quantity: product.quantity || 1,
				instock: product.instock,
				instockBySubUnit: this.instockBySubUnit(product),
				type: product.type || "addition", // subtraction, addition
				stockVariant: "primary",
				decrementBtn: "primary",
				incrementBtn: "primary"
			});
		},

		updateDetail(detail) {
			let details = [...this.adjustment.details];

			this.adjustment.details = [];

			details = details.map((oldDetail) => {
				if (oldDetail.product == detail.product && oldDetail.variantId == detail.variantId) {
					return { ...oldDetail, instockBySubUnit: this.instockBySubUnit(oldDetail) };
				}

				return oldDetail;
			});

			this.$nextTick(() => {
				this.adjustment.details = details;
			});
		},

		removeDetail(index) {
			this.adjustment.details.splice(index, 1);
		},

		mainUnit(product) {
			return this.unitsOptions.find((unit) => product.unit == unit._id);
		},

		subUnit(product) {
			let mainUnit = this.mainUnit(product);

			let subUnit = mainUnit.subUnits.find((unit) => unit._id == product.subUnit);

			return subUnit;
		},

		instockBySubUnit(product) {
			// this instock depended on main unit and it is come from api;
			let instockBySubUnit = +product.instock;

			if (!instockBySubUnit) return 0;

			let subUnit = this.subUnit(product);

			//? reverse operator if sub unit is not main unit to get right instock value
			let isMultiple = subUnit.operator === "*" && subUnit._id == product.unit;

			instockBySubUnit = isMultiple ? instockBySubUnit * +subUnit.value : instockBySubUnit / +subUnit.value;

			return instockBySubUnit;
		},

		incrementQuantity(row) {
			if (/^\d+$|^\d+\.\d+$|^\.\d+$/.test(row.item.quantity)) {
				if (!this.isUpdate || (this.isUpdate && this.oldAdjustment.warehouse != this.adjustment.warehouse)) {
					if (row.item.type == "subtraction") {
						if (row.item.quantity >= row.item.instockBySubUnit) {
							if (row.item.timeout) clearTimeout(row.item.timeout);

							row.item.stockVariant = row.item.incrementBtn = "danger";

							row.item.timeout = setTimeout(() => {
								row.item.stockVariant = row.item.incrementBtn = "primary";
							}, 300);

							return;
						}

						if (row.item.quantity + 1 > row.item.instockBySubUnit) {
							return (row.item.quantity = row.item.instockBySubUnit);
						}
					}
				}

				return (row.item.quantity += 1);
			}

			row.item.quantity = row.item.instockBySubUnit || 1;
		},

		decrementQuantity(row) {
			let isValid = /^\d+$|^\d+\.\d+$|^\.\d+$/.test(row.item.quantity);

			if (isValid && row.item.quantity - 1 > 0) {
				return (row.item.quantity -= 1);
			}

			if (row.item.quantity == 1 || row.item.quantity == row.item.instockBySubUnit) {
				if (row.item.timeout) clearTimeout(row.item.timeout);

				row.item.decrementBtn = "danger";

				row.item.timeout = setTimeout(() => (row.item.decrementBtn = "primary"), 300);
				return;
			}

			row.item.quantity = row.item.instockBySubUnit || 1;
		},

		quantityChanged(row, value) {
			let regex = /^\d+$|^\d+\.\d+$|^\.\d+$/;

			row.item.quantity = parseFloat(value);

			let isValid = regex.test(row.item.quantity);

			if (!isValid || row.item.quantity <= 0) {
				row.item.quantity = row.item.instockBySubUnit || 1;
				return;
			}

			if (!this.isUpdate || (this.isUpdate && this.oldAdjustment.warehouse != this.adjustment.warehouse)) {
				if (!isValid || row.item.quantity <= 0 || (row.item.type == "subtraction" && row.item.instockBySubUnit < row.item.quantity)) {
					row.item.quantity = row.item.instockBySubUnit || 1;
				}
			}
		},

		quantityInputFocused(e) {
			e.currentTarget && e.currentTarget?.select();
		},

		typeVariant(detail) {
			if (detail.type == "subtraction") {
				if (detail.quantity > detail.instockBySubUnit) return "danger";
				return "warning";
			} else {
				return "success";
			}
		},

		toggleType(detail) {
			let isAddition = detail.type == "addition";

			detail._rowVariant = "";
			detail.stockVariant = "primary";

			detail.type = isAddition ? "subtraction" : "addition";

			if (isAddition) {
				if (detail.instockBySubUnit <= 0) {
					detail._rowVariant = "danger";
					detail.stockVariant = "danger";
				}

				if (detail.quantity > detail.instockBySubUnit) {
					detail.quantity = detail.instockBySubUnit || 1;
				}
			}
		},

		changeSubUnit(detail) {
			let mainUnit = this.mainUnit(detail);

			if (!mainUnit) return;

			let subUnits = mainUnit.subUnits;

			if (!subUnits.length) return;

			if (subUnits.length == 1) {
				detail.subUnit = subUnits[0]._id;
			} else {
				let index = subUnits.findIndex((unit) => unit._id == detail.subUnit);

				if (index == -1 || index == subUnits.length - 1) {
					detail.subUnit = subUnits[0]._id;
				} else {
					detail.subUnit = subUnits[index + 1]._id;
				}
			}

			detail.instockBySubUnit = this.instockBySubUnit(detail);

			if (detail.type == "subtraction" && detail.instockBySubUnit < detail.quantity) {
				detail.quantity = detail.instockBySubUnit || 1;
			}
		},

		async handleSave(e) {
			e.preventDefault();

			this.$v.$touch();

			if (this.$v.$invalid) return;

			let details = [];

			for (let detail of this.adjustment.details) {
				if (detail.type == "subtraction") {
					if (!this.isUpdate || (this.isUpdate && this.oldAdjustment.warehouse != this.adjustment.warehouse)) {
						let message = this.$t("forms.notEnoughStock", { field: detail.name });
						if (detail.quantity > detail.instockBySubUnit) return showMessage({ message, error: true });
					}
				}

				details.push({
					product: detail.product,
					variant: detail.variantId,
					quantity: detail.quantity,
					subUnit: detail.subUnit,
					type: detail.type
				});
			}

			this.isBusy = true;

			let action = this.isUpdate ? this.update : this.create;

			try {
				let data = await action({ ...this.adjustment, details });

				this.$router.push({ name: "Adjustment", params: { id: data._id } });

				let message = this.isUpdate ? "messages.updated" : "messages.created";

				showMessage({ message: this.$t(message) });
			} catch (error) {
				if (error.status == 422 && error.type == "quantity") {
					this.handleQuantityError(error.errors);
				} else {
					this.$store.commit("Adjustments/setError", error);
				}
			} finally {
				this.isBusy = false;
			}
		},

		handleQuantityError(errors) {
			this.quantityErrors = errors.map((error) => {
				let e = {
					product: error.product,
					variant: error.variant,
					warehouse: error.warehouse,
					quantity: error.quantity
				};

				if (error.unit && error.unit._id) {
					e.unit = error.unit;
				} else {
					let unit = this.unitsOptions.find((u) => u._id == error.unit);

					if (unit) e.unit = unit;
				}

				return e;
			});

			this.$bvModal.show("quantityErrors");
		},

		handleCancel() {
			this.$router.push({ name: "Adjustments" });
		}
	}
};
</script>

<style lang="scss">
.invoice-details-table {
	thead {
		border: 1px solid #dee2e6;
		th {
			border-top: 0;
			border: 0;
			color: var(--gray);
			font-size: 0.75rem;
			padding-left: 1rem;
			border-right: 1px solid #dee2e6;
		}
	}
	tbody {
		tr:first-child {
			td {
				border-top: 0;
			}
		}
	}
	.table.b-table.b-table-stacked-lg > tbody > tr {
		@media (max-width: 991.98px) {
			& > td {
				display: flex;
			}
			& > [data-label]::before {
				float: none;
				text-align: left;
				margin-top: auto;
				margin-bottom: auto;
				width: 35%;
			}
			& > [data-label]::after {
				display: none;
			}
		}
		@media (min-width: 650.98px) and (max-width: 991.98px) {
			& > [data-label]::before {
				margin-left: 30%;
			}
		}
		@media (max-width: 650.98px) {
			& > [data-label]::before {
				width: 40%;
			}
		}
	}
}
</style>
