<template>
	<default-modal id="expenseFormModal" @ok="handleSave" @hidden="resetForm" :isBusy="isBusy" :title="formTitle" @show="isOpened" :settings="modalSettings">
		<div class="expense-form">
			<b-form v-on:submit="handleSave">
				<b-row cols="1" cols-md="2">
					<!-- Amount Input -->
					<b-col>
						<default-input
							ref="inputAmount"
							label="Amount"
							placeholder="Enter Expense Amount"
							field="amount"
							:vuelidate="$v.expense"
							namespace="Expenses"
							type="number"
						/>
					</b-col>
					<!-- Date Input -->
					<b-col>
						<default-date-picker-input label="Date" field="date" :vuelidate="$v.expense" namespace="Expenses" />
					</b-col>
					<!-- Warehouse Input -->
					<b-col>
						<default-select label="Warehouse" field="warehouse" :options="warehouseOptions" :vuelidate="$v.expense" namespace="Expenses" />
					</b-col>
					<!-- Category Expense Input -->
					<b-col>
						<default-select label="Category Expense" field="category" :options="expenseCategoriesOptions" :vuelidate="$v.expense" namespace="Expenses" />
					</b-col>
					<!-- Details Input -->
					<b-col md="12">
						<default-text-area label="Details" placeholder="Enter Expense Details" field="details" :vuelidate="$v.expense" namespace="Expenses" />
					</b-col>
				</b-row>
				<input type="submit" hidden />
			</b-form>
		</div>
	</default-modal>
</template>

<script>
	import { mapActions, mapState } from "vuex";

	import { required, maxLength, minValue, numeric } from "vuelidate/lib/validators";

	import { validationMixin } from "vuelidate";

	import { getDate } from "@/helpers";

	const DefaultInput = () => import("@/components/ui/DefaultInput");

	const DefaultSelect = () => import("@/components/ui/DefaultSelect");

	const DefaultDatePickerInput = () => import("@/components/ui/DefaultDatePickerInput");

	const DefaultTextArea = () => import("@/components/ui/DefaultTextArea");

	const DefaultModal = () => import("@/components/ui/DefaultModal");

	export default {
		components: { DefaultModal, DefaultInput, DefaultSelect, DefaultDatePickerInput, DefaultTextArea },

		mixins: [validationMixin],

		data: () => ({
			expense: { amount: "", date: "", category: null, warehouse: null, details: "" },

			isBusy: false,

			modalSettings: { stayOpen: false, showStayOpenBtn: true }
		}),

		validations: {
			expense: {
				amount: { required, numeric, minValue: minValue(1) },
				date: { required },
				category: { required },
				warehouse: { required },
				details: { maxLength: maxLength(254) }
			}
		},

		mounted() {
			this.getExpenseCategoriesOptions();
			this.getWarehouseOptions();
		},

		computed: {
			...mapState({
				oldExpense: (state) => state.Expenses.one,
				expenseCategoriesOptions: (state) => state.ExpenseCategories.options,
				warehouseOptions: (state) => state.Warehouses.options
			}),

			isUpdate() {
				return !!this.oldExpense._id;
			},

			formTitle() {
				return this.isUpdate ? "Edit Expense" : "Create Expense";
			}
		},

		methods: {
			...mapActions({
				create: "Expenses/create",
				update: "Expenses/update",
				getExpenseCategoriesOptions: "ExpenseCategories/getOptions",
				getWarehouseOptions: "Warehouses/getOptions"
			}),

			isOpened() {
				if (this.isUpdate) {
					for (let key in this.expense) {
						if ((key == "category" || key == "warehouse") && this.oldExpense[key]) {
							this.expense[key] = this.oldExpense[key]._id || null;
							continue;
						} else if (key == "date") {
							this.expense[key] = getDate(this.oldExpense[key]);
							continue;
						}

						this.expense[key] = this.oldExpense[key];
					}

					this.modalSettings.showStayOpenBtn = false;
				} else {
					this.resetForm();
					this.modalSettings.showStayOpenBtn = true;
				}

				setTimeout(() => {
					this.$refs?.inputAmount?.$children[0]?.$children[0]?.focus();
				}, 300);
			},

			async handleSave(bvt) {
				bvt.preventDefault();

				this.$v.$touch();

				if (this.$v.expense.$invalid) return;

				this.isBusy = true;

				try {
					let action = this.isUpdate ? this.update : this.create;

					let res = await action(this.expense);

					let message = "actions.created";

					if (res.status == 200) {
						message = "actions.updated";
					}

					message = this.$t(message, { module: "Expense" });

					this.$store.commit("showToast", message);

					if (!this.modalSettings.showStayOpenBtn || !this.modalSettings.stayOpen) {
						return this.$bvModal.hide("expenseFormModal");
					}

					this.resetForm();

					this.$refs?.inputAmount?.$children[0]?.$children[0]?.focus();
				} catch (e) {
					this.$store.commit("Expenses/setError", e);
				} finally {
					this.isBusy = false;
				}
			},

			resetForm() {
				this.expense = { amount: "", date: "", category: null, warehouse: null, details: "" };

				this.$store.commit("Expenses/resetError");

				this.$store.commit("Expenses/setOne", {});

				this.$nextTick(this.$v.$reset);
			}
		}
	};
</script>
