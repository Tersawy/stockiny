<template>
	<default-modal
		id="expenseCategoryFormModal"
		@ok="handleSave"
		@hidden="resetForm"
		:isBusy="isBusy"
		:title="formTitle"
		@show="isOpened"
		:stayOpen.sync="modalSettings.stayOpen"
		:showStayOpenBtn="modalSettings.showStayOpenBtn"
	>
		<div class="expenseCategory-form">
			<b-form v-on:submit="handleSave">
				<b-row cols="1">
					<!-- Name Input -->
					<b-col>
						<default-input
							ref="inputName"
							label="Name"
							placeholder="Enter Expense Category Name"
							field="name"
							:vuelidate="$v.expenseCategory"
							namespace="ExpenseCategories"
						/>
					</b-col>
					<!-- Description Input -->
					<b-col>
						<default-text-area
							label="Description"
							placeholder="Enter Expense Category Description"
							field="description"
							:vuelidate="$v.expenseCategory"
							namespace="ExpenseCategories"
						/>
					</b-col>
				</b-row>
				<input type="submit" hidden />
			</b-form>
		</div>
	</default-modal>
</template>

<script>
import { mapActions, mapState } from "vuex";

import { required, maxLength, minLength } from "vuelidate/lib/validators";

import { validationMixin } from "vuelidate";

const DefaultInput = () => import("@/components/inputs/DefaultInput");

const DefaultTextArea = () => import("@/components/inputs/DefaultTextArea");

const DefaultModal = () => import("@/components/DefaultModal");

export default {
	components: { DefaultModal, DefaultInput, DefaultTextArea },

	mixins: [validationMixin],

	data: () => ({
		expenseCategory: { name: "", description: "" },

		isBusy: false,

		modalSettings: { stayOpen: false, showStayOpenBtn: true }
	}),

	validations: {
		expenseCategory: {
			name: { required, minValue: minLength(3), maxLength: maxLength(54) },
			description: { maxLength: maxLength(254) }
		}
	},

	computed: {
		...mapState({
			oldExpenseCategory: (state) => state.ExpenseCategories.one
		}),

		isUpdate() {
			return !!this.oldExpenseCategory._id;
		},

		formTitle() {
			return this.isUpdate ? "Edit Expense Category" : "Create Expense Category";
		}
	},

	methods: {
		...mapActions("ExpenseCategories", ["create", "update", "getOptions"]),

		isOpened() {
			if (this.isUpdate) {
				for (let key in this.expenseCategory) {
					this.expenseCategory[key] = this.oldExpenseCategory[key];
				}

				this.modalSettings.showStayOpenBtn = false;
			} else {
				this.resetForm();
				this.modalSettings.showStayOpenBtn = true;
			}

			setTimeout(() => {
				this.$refs?.inputName?.$children[0]?.$children[0]?.focus();
			}, 300);
		},

		async handleSave(bvt) {
			bvt.preventDefault();

			this.$v.$touch();

			if (this.$v.expenseCategory.$invalid) return;

			this.isBusy = true;

			try {
				let action = this.isUpdate ? this.update : this.create;

				let res = await action(this.expenseCategory);

				let message = "actions.created";

				if (res.status == 200) {
					message = "actions.updated";
				}

				this.getOptions();

				message = this.$t(message, { module: "Expense Category" });

				this.$store.commit("showToast", message);

				if (!this.modalSettings.showStayOpenBtn || !this.modalSettings.stayOpen) {
					return this.$bvModal.hide("expenseCategoryFormModal");
				}

				this.resetForm();

				this.$refs?.inputName?.$children[0]?.$children[0]?.focus();
			} catch (e) {
				this.$store.commit("ExpenseCategories/setError", e);
			} finally {
				this.isBusy = false;
			}
		},

		resetForm() {
			this.expenseCategory = { name: "", description: "" };

			this.$store.commit("ExpenseCategories/resetError");

			this.$store.commit("ExpenseCategories/setOne", {});

			this.$nextTick(this.$v.$reset);
		}
	}
};
</script>
