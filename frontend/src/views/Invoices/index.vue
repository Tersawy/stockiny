<template>
	<main-content :breads="breads">
		<b-row cols="1" cols-xl="2">
			<b-col>
				<b-card class="invoice-card h-100">
					<template #header>
						<h6 class="mb-0">Purchases</h6>
					</template>

					<div class="d-flex align-items-center justify-content-between border rounded-lg py-2 px-3 mb-2 mb-sm-4 shadow-sm bg-light">
						<h6 class="text-muted mb-0">Statuses</h6>
						<b-btn class="add-status-btn px-2 py-0" variant="outline-primary" size="sm" @click="openStatusForm(createPurchaseStatus)">
							<IconPlus color="var(--primary)" />
							<span class="mx-1">add</span>
						</b-btn>
					</div>

					<b-table
						striped
						stacked="sm"
						hover
						v-if="purchaseStatuses && purchaseStatuses.length"
						:fields="fields"
						:items="purchaseStatuses"
						small
						class="status-table m-0"
					>
						<template #cell(name)="{ item }">
							<InvoiceStatus :status="item" />
						</template>

						<template #cell(effected)="{ item }">
							<b-form-checkbox v-model="item.effected" @change="setEffectedStatus(changePurchaseStatusEffected, item)" switch :disabled="item.effected" />
						</template>

						<template #cell(actions)="{ item }">
							<div class="d-flex align-items-center">
								<a @click="openStatusForm(updatePurchaseStatus, item)" class="text-success">
									<EditIcon />
								</a>

								<a v-if="!item.effected" @click="openDeleteStatusModal(deletePurchaseStatus, item)" class="text-danger ml-3">
									<TrashIcon />
								</a>
							</div>
						</template>
					</b-table>
				</b-card>
			</b-col>
			<b-col class="mt-4 mt-xl-0">
				<b-card class="invoice-card h-100">
					<template #header>
						<h6 class="mb-0">Returns Purchases</h6>
					</template>

					<div class="d-flex align-items-center justify-content-between border rounded-lg py-2 px-3 mb-2 mb-sm-4 shadow-sm bg-light">
						<h6 class="text-muted mb-0">Statuses</h6>
						<b-btn class="add-status-btn px-2 py-0" variant="outline-primary" size="sm" @click="openStatusForm(createPurchaseReturnStatus)">
							<IconPlus color="var(--primary)" />
							<span class="mx-1">add</span>
						</b-btn>
					</div>

					<b-table
						striped
						stacked="sm"
						hover
						v-if="purchaseReturnStatuses && purchaseReturnStatuses.length"
						:fields="fields"
						:items="purchaseReturnStatuses"
						small
						class="status-table m-0"
					>
						<template #cell(name)="{ item }">
							<InvoiceStatus :status="item" />
						</template>

						<template #cell(effected)="{ item }">
							<b-form-checkbox v-model="item.effected" @change="setEffectedStatus(changePurchaseReturnStatusEffected, item)" switch :disabled="item.effected" />
						</template>

						<template #cell(actions)="{ item }">
							<div class="d-flex align-items-center">
								<a @click="openStatusForm(updatePurchaseReturnStatus, item)" class="text-success">
									<EditIcon />
								</a>

								<a v-if="!item.effected" @click="openDeleteStatusModal(deletePurchaseReturnStatus, item)" class="text-danger ml-3">
									<TrashIcon />
								</a>
							</div>
						</template>
					</b-table>
				</b-card>
			</b-col>
			<b-col class="mt-4">
				<b-card class="invoice-card h-100">
					<template #header>
						<h6 class="mb-0">Sales</h6>
					</template>

					<div class="d-flex align-items-center justify-content-between border rounded-lg py-2 px-3 mb-2 mb-sm-4 shadow-sm bg-light">
						<h6 class="text-muted mb-0">Statuses</h6>
						<b-btn class="add-status-btn px-2 py-0" variant="outline-primary" size="sm" @click="openStatusForm(createSaleStatus)">
							<IconPlus color="var(--primary)" />
							<span class="mx-1">add</span>
						</b-btn>
					</div>

					<b-table striped stacked="sm" hover v-if="saleStatuses && saleStatuses.length" :fields="fields" :items="saleStatuses" small class="status-table m-0">
						<template #cell(name)="{ item }">
							<InvoiceStatus :status="item" />
						</template>

						<template #cell(effected)="{ item }">
							<b-form-checkbox v-model="item.effected" @change="setEffectedStatus(changeSaleStatusEffected, item)" switch :disabled="item.effected" />
						</template>

						<template #cell(actions)="{ item }">
							<div class="d-flex align-items-center">
								<a @click="openStatusForm(updateSaleStatus, item)" class="text-success">
									<EditIcon />
								</a>

								<a v-if="!item.effected" @click="openDeleteStatusModal(deleteSaleStatus, item)" class="text-danger ml-3">
									<TrashIcon />
								</a>
							</div>
						</template>
					</b-table>
				</b-card>
			</b-col>
			<b-col class="mt-4">
				<b-card class="invoice-card h-100">
					<template #header>
						<h6 class="mb-0">Returns Sales</h6>
					</template>

					<div class="d-flex align-items-center justify-content-between border rounded-lg py-2 px-3 mb-2 mb-sm-4 shadow-sm bg-light">
						<h6 class="text-muted mb-0">Statuses</h6>
						<b-btn class="add-status-btn px-2 py-0" variant="outline-primary" size="sm" @click="openStatusForm(createSaleReturnStatus)">
							<IconPlus color="var(--primary)" />
							<span class="mx-1">add</span>
						</b-btn>
					</div>

					<b-table
						striped
						stacked="sm"
						hover
						v-if="saleReturnStatuses && saleReturnStatuses.length"
						:fields="fields"
						:items="saleReturnStatuses"
						small
						class="status-table m-0"
					>
						<template #cell(name)="{ item }">
							<InvoiceStatus :status="item" />
						</template>

						<template #cell(effected)="{ item }">
							<b-form-checkbox v-model="item.effected" @change="setEffectedStatus(changeSaleReturnStatusEffected, item)" switch :disabled="item.effected" />
						</template>

						<template #cell(actions)="{ item }">
							<div class="d-flex align-items-center">
								<a @click="openStatusForm(updateSaleReturnStatus, item)" class="text-success">
									<EditIcon />
								</a>

								<a v-if="!item.effected" @click="openDeleteStatusModal(deleteSaleReturnStatus, item)" class="text-danger ml-3">
									<TrashIcon />
								</a>
							</div>
						</template>
					</b-table>
				</b-card>
			</b-col>
			<b-col class="mt-4">
				<b-card class="invoice-card h-100">
					<template #header>
						<h6 class="mb-0">Transfers</h6>
					</template>

					<div class="d-flex align-items-center justify-content-between border rounded-lg py-2 px-3 mb-2 mb-sm-4 shadow-sm bg-light">
						<h6 class="text-muted mb-0">Statuses</h6>
						<b-btn class="add-status-btn px-2 py-0" variant="outline-primary" size="sm" @click="openStatusForm(createTransferStatus)">
							<IconPlus color="var(--primary)" />
							<span class="mx-1">add</span>
						</b-btn>
					</div>

					<b-table
						striped
						stacked="sm"
						hover
						v-if="transferStatuses && transferStatuses.length"
						:fields="fields"
						:items="transferStatuses"
						small
						class="status-table m-0"
					>
						<template #cell(name)="{ item }">
							<InvoiceStatus :status="item" />
						</template>

						<template #cell(effected)="{ item }">
							<b-form-checkbox v-model="item.effected" @change="setEffectedStatus(changeTransferStatusEffected, item)" switch :disabled="item.effected" />
						</template>

						<template #cell(actions)="{ item }">
							<div class="d-flex align-items-center">
								<a @click="openStatusForm(updateTransferStatus, item)" class="text-success">
									<EditIcon />
								</a>

								<a v-if="!item.effected" @click="openDeleteStatusModal(deleteTransferStatus, item)" class="text-danger ml-3">
									<TrashIcon />
								</a>
							</div>
						</template>
					</b-table>
				</b-card>
			</b-col>
		</b-row>

		<StatusForm :statusHandler="statusHandler" :oldStatus="status" />
		<DeleteModal ref="deleteModal" field="Status" @ok="handleDeleteStatus" />
	</main-content>
</template>

<script>
import { mapActions, mapState } from "vuex";

import IconPlus from "@/components/icons/plus";

import EditIcon from "@/components/icons/edit";

import TrashIcon from "@/components/icons/trash";

const StatusForm = () => import("@/components/forms/StatusForm");

const InvoiceStatus = () => import("@/components/InvoiceStatus");

const DeleteModal = () => import("@/components/DeleteModal");

export default {
	components: { StatusForm, InvoiceStatus, DeleteModal, IconPlus, TrashIcon, EditIcon },

	data() {
		return {
			breads: [{ title: "Dashboard", link: "/" }, { title: "Invoices Settings" }],

			fields: ["name", "description", "effected", "actions"],

			status: null,

			statusHandler: null
		};
	},

	async mounted() {
		await this.getAllStatuses();
	},

	computed: {
		...mapState({
			purchaseStatuses: (state) => state.Purchases.statuses,
			purchaseReturnStatuses: (state) => state.PurchasesReturn.statuses,
			saleStatuses: (state) => state.Sales.statuses,
			saleReturnStatuses: (state) => state.SalesReturn.statuses,
			transferStatuses: (state) => state.Transfers.statuses
		})
	},

	methods: {
		...mapActions({
			getPurchaseStatuses: "Purchases/getStatuses",
			createPurchaseStatus: "Purchases/createStatus",
			updatePurchaseStatus: "Purchases/updateStatus",
			changePurchaseStatusEffected: "Purchases/changeEffectedStatus",
			deletePurchaseStatus: "Purchases/deleteStatus",

			getPurchaseReturnStatuses: "PurchasesReturn/getStatuses",
			createPurchaseReturnStatus: "PurchasesReturn/createStatus",
			updatePurchaseReturnStatus: "PurchasesReturn/updateStatus",
			changePurchaseReturnStatusEffected: "PurchasesReturn/changeEffectedStatus",
			deletePurchaseReturnStatus: "PurchasesReturn/deleteStatus",

			getSaleStatuses: "Sales/getStatuses",
			createSaleStatus: "Sales/createStatus",
			updateSaleStatus: "Sales/updateStatus",
			changeSaleStatusEffected: "Sales/changeEffectedStatus",
			deleteSaleStatus: "Sales/deleteStatus",

			getSaleReturnStatuses: "SalesReturn/getStatuses",
			createSaleReturnStatus: "SalesReturn/createStatus",
			updateSaleReturnStatus: "SalesReturn/updateStatus",
			changeSaleReturnStatusEffected: "SalesReturn/changeEffectedStatus",
			deleteSaleReturnStatus: "SalesReturn/deleteStatus",

			getTransferStatuses: "Transfers/getStatuses",
			createTransferStatus: "Transfers/createStatus",
			updateTransferStatus: "Transfers/updateStatus",
			changeTransferStatusEffected: "Transfers/changeEffectedStatus",
			deleteTransferStatus: "Transfers/deleteStatus"
		}),

		getAllStatuses() {
			return Promise.all([
				this.getPurchaseStatuses(),
				this.getPurchaseReturnStatuses(),
				this.getSaleStatuses(),
				this.getSaleReturnStatuses(),
				this.getTransferStatuses()
			]);
		},

		openStatusForm(statusHandler, status) {
			this.statusHandler = statusHandler;

			this.status = status ? { ...status } : null;

			this.$nextTick(() => this.$bvModal.show("statusFormModal"));
		},

		openDeleteStatusModal(statusHandler, status) {
			this.$refs.deleteModal.open({ status, statusHandler });
		},

		async handleDeleteStatus({ statusHandler, status }) {
			this.$refs.deleteModal.setBusy(true);

			try {
				await statusHandler(status);

				this.$store.commit("showMessage", { message: this.$t("messages.deleted") });
			} catch (error) {
				console.log(error);
				this.$store.commit("showMessage", { error: true });
			} finally {
				this.$refs.deleteModal.close();
			}
		},

		async setEffectedStatus(statusHandler, status) {
			try {
				await statusHandler(status);

				this.$store.commit("showMessage");
			} catch (error) {
				this.$store.commit("showMessage", { error: true });
			}
		}
	}
};
</script>

<style lang="scss">
.add-status-btn {
	display: flex;
	align-items: center;
	&:hover {
		svg {
			&,
			& path {
				fill: var(--white) !important;
				transition: inherit;
			}
		}
	}
}

.status-table {
	thead {
		border: 1px solid #dee2e6;
		border-radius: 15px;
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
		td {
			padding-left: 1rem;
		}
		@media (max-width: 575.98px) {
			td {
				padding-left: 0.75rem;
				padding-top: 10px;
				padding-bottom: 10px;
			}
		}
	}
}
@media (max-width: 575.98px) {
	.invoice-card {
		background-color: transparent;
		border: none;
		.card-header {
			border: 1px solid rgba(0, 0, 0, 0.125);
			background-color: var(--primary);
			color: #fff;
		}
		.card-body {
			padding-left: 0;
			padding-right: 0;
		}
	}
	.table.b-table.b-table-stacked-sm {
		& > tbody {
			padding: 6px 3px;
			max-height: 550px;
			overflow-y: auto;
			& > tr {
				& > [data-label]::before {
					text-align: left;
				}
				& > :first-child {
					border: 0;
				}
			}
		}
	}
	.table-striped tbody tr {
		border: 0;
		border-radius: 0.3rem;
		transition: transform 0.1s ease-in-out, box-shadow 0.1s ease-in-out;
		&:nth-of-type(odd) {
			background-color: var(--white);
		}
		&:hover {
			color: #212529;
			background-color: var(--white);
			box-shadow: 0 0.125rem 0.25rem #00000013 !important;
		}
		&:not(:last-child) {
			margin-bottom: 10px;
		}
	}
}
</style>
