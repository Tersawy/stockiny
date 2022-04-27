<template>
	<default-modal id="statusFormModal" @ok="handleSave" @hidden="resetForm" :isBusy="isBusy" :title="formTitle" @show="isOpened" :settings="modalSettings">
		<div class="status-form">
			<b-form v-on:submit="handleSave">
				<b-row cols="1">
					<!-- Name Input -->
					<b-col sm="10">
						<default-input ref="inputName" label="Name" placeholder="Enter Status Name" field="name" :vuelidate="$v.status" namespace="Invoices" />
					</b-col>
					<!-- Name Input -->
					<b-col sm="2" class="pl-sm-0">
						<default-input type="color" label="Color" placeholder="Enter Status Color" field="color" :vuelidate="$v.status" namespace="Invoices" />
					</b-col>
					<!-- Description Input -->
					<b-col>
						<default-text-area label="Description" placeholder="Enter Status Description" field="description" :vuelidate="$v.status" namespace="Invoices" />
					</b-col>
				</b-row>
				<input type="submit" hidden />
			</b-form>
		</div>
	</default-modal>
</template>

<script>
import { required, maxLength, minLength } from "vuelidate/lib/validators";

import { validationMixin } from "vuelidate";

const DefaultInput = () => import("@/components/ui/DefaultInput");

const DefaultTextArea = () => import("@/components/ui/DefaultTextArea");

const DefaultModal = () => import("@/components/ui/DefaultModal");

export default {
	components: { DefaultModal, DefaultInput, DefaultTextArea },

	props: {
		oldStatus: { type: Object, default: () => ({}) },

		statusHandler: { type: Function }
	},

	mixins: [validationMixin],

	data: () => ({
		status: { name: "", color: "#12ba34", description: "", _id: "" },

		isBusy: false,

		modalSettings: { stayOpen: false, showStayOpenBtn: true }
	}),

	validations: {
		status: {
			name: { required, minValue: minLength(3), maxLength: maxLength(54) },
			description: { maxLength: maxLength(254) },
			color: {}
		}
	},

	computed: {
		isUpdate() {
			return !!this.oldStatus?._id;
		},

		formTitle() {
			return this.isUpdate ? "Edit Status" : "Create Status";
		}
	},

	methods: {
		isOpened() {
			if (this.isUpdate) {
				for (let key in this.status) {
					this.status[key] = this.oldStatus[key];
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

			if (this.$v.status.$invalid) return;

			this.isBusy = true;

			let data = { ...this.status, invoiceName: this.invoiceName };

			try {
				let { status } = await this.statusHandler(data);

				let message = status == 200 ? "messages.updated" : "messages.created";

				message = this.$t(message);

				this.$store.commit("showMessage", { message });

				if (!this.modalSettings.showStayOpenBtn || !this.modalSettings.stayOpen) {
					return this.$bvModal.hide("statusFormModal");
				}

				this.resetForm();

				this.$refs?.inputName?.$children[0]?.$children[0]?.focus();
			} catch (e) {
				this.$store.commit("Invoices/setError", e);
			} finally {
				this.isBusy = false;
			}
		},

		resetForm() {
			this.status = { name: "", description: "", color: "#12ba34", _id: "" };

			this.$store.commit("Invoices/resetError");

			this.$nextTick(this.$v.$reset);
		}
	}
};
</script>
