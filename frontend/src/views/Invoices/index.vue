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
						<b-btn class="add-status-btn px-2 py-0" variant="outline-primary" size="sm" @click="openStatusForm('purchases')">
							<IconPlus color="var(--primary)" />
							<span class="mx-1">add</span>
						</b-btn>
					</div>

					<b-table
						striped
						stacked="sm"
						hover
						v-if="purchases.statuses && purchases.statuses.length"
						:fields="fields"
						:items="purchases.statuses"
						small
						class="status-table m-0"
					>
						<template #cell(name)="{ item }">
							<InvoiceStatus :status="item" />
						</template>

						<template #cell(effected)="{ item }">
							<b-form-checkbox v-model="item.effected" @change="setEffectedStatus('purchases', item)" switch :disabled="item.effected" />
						</template>

						<template #cell(actions)="{ item }">
							<div class="d-flex align-items-center">
								<a @click="openStatusForm('purchases', item)" class="text-success">
									<EditIcon />
								</a>

								<a v-if="!item.effected" @click="openDeleteStatusModal('purchases', item)" class="text-danger ml-3">
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
						<b-btn class="add-status-btn px-2 py-0" variant="outline-primary" size="sm" @click="openStatusForm('purchases-return')">
							<IconPlus color="var(--primary)" />
							<span class="mx-1">add</span>
						</b-btn>
					</div>

					<b-table
						striped
						stacked="sm"
						hover
						v-if="purchasesReturn.statuses && purchasesReturn.statuses.length"
						:fields="fields"
						:items="purchasesReturn.statuses"
						small
						class="status-table m-0"
					>
						<template #cell(name)="{ item }">
							<InvoiceStatus :status="item" />
						</template>

						<template #cell(effected)="{ item }">
							<b-form-checkbox v-model="item.effected" @change="setEffectedStatus('purchases-return', item)" switch :disabled="item.effected" />
						</template>

						<template #cell(actions)="{ item }">
							<div class="d-flex align-items-center">
								<a @click="openStatusForm('purchases-return', item)" class="text-success">
									<EditIcon />
								</a>

								<a v-if="!item.effected" @click="openDeleteStatusModal('purchases-return', item)" class="text-danger ml-3">
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
						<b-btn class="add-status-btn px-2 py-0" variant="outline-primary" size="sm" @click="openStatusForm('sales')">
							<IconPlus color="var(--primary)" />
							<span class="mx-1">add</span>
						</b-btn>
					</div>

					<b-table striped stacked="sm" hover v-if="sales.statuses && sales.statuses.length" :fields="fields" :items="sales.statuses" small class="status-table m-0">
						<template #cell(name)="{ item }">
							<InvoiceStatus :status="item" />
						</template>

						<template #cell(effected)="{ item }">
							<b-form-checkbox v-model="item.effected" @change="setEffectedStatus('sales', item)" switch :disabled="item.effected" />
						</template>

						<template #cell(actions)="{ item }">
							<div class="d-flex align-items-center">
								<a @click="openStatusForm('sales', item)" class="text-success">
									<EditIcon />
								</a>

								<a v-if="!item.effected" @click="openDeleteStatusModal('sales', item)" class="text-danger ml-3">
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
						<b-btn class="add-status-btn px-2 py-0" variant="outline-primary" size="sm" @click="openStatusForm('sales-return')">
							<IconPlus color="var(--primary)" />
							<span class="mx-1">add</span>
						</b-btn>
					</div>

					<b-table
						striped
						stacked="sm"
						hover
						v-if="salesReturn.statuses && salesReturn.statuses.length"
						:fields="fields"
						:items="salesReturn.statuses"
						small
						class="status-table m-0"
					>
						<template #cell(name)="{ item }">
							<InvoiceStatus :status="item" />
						</template>

						<template #cell(effected)="{ item }">
							<b-form-checkbox v-model="item.effected" @change="setEffectedStatus('sales-return', item)" switch :disabled="item.effected" />
						</template>

						<template #cell(actions)="{ item }">
							<div class="d-flex align-items-center">
								<a @click="openStatusForm('sales-return', item)" class="text-success">
									<EditIcon />
								</a>

								<a v-if="!item.effected" @click="openDeleteStatusModal('sales-return', item)" class="text-danger ml-3">
									<TrashIcon />
								</a>
							</div>
						</template>
					</b-table>
				</b-card>
			</b-col>
		</b-row>

		<StatusForm :invoiceName="invoiceName" :oldStatus="invoiceStatus" />
		<DeleteModal ref="deleteModal" field="Status" @ok="handleDeleteStatus" />
	</main-content>
</template>

<script>
	import { mapActions, mapState } from "vuex";

	import IconPlus from "@/components/icons/plus";

	import EditIcon from "@/components/icons/edit";

	import TrashIcon from "@/components/icons/trash";

	const StatusForm = () => import("@/components/forms/StatusForm");

	const InvoiceStatus = () => import("@/components/ui/InvoiceStatus");

	const DeleteModal = () => import("@/components/ui/DeleteModal");

	export default {
		components: { StatusForm, InvoiceStatus, DeleteModal, IconPlus, TrashIcon, EditIcon },

		data() {
			return {
				breads: [{ title: "Dashboard", link: "/" }, { title: "Invoices Settings" }],

				fields: ["name", "description", "effected", "actions"],

				invoiceStatus: null,

				invoiceName: null
			};
		},

		async mounted() {
			await this.getAll();
		},

		computed: {
			...mapState("Invoices", ["all"]),

			purchases() {
				return this.all?.docs?.find((doc) => doc.name == "purchases") || {};
			},

			purchasesReturn() {
				return this.all?.docs?.find((doc) => doc.name == "purchases-return") || {};
			},

			sales() {
				return this.all?.docs?.find((doc) => doc.name == "sales") || {};
			},

			salesReturn() {
				return this.all?.docs?.find((doc) => doc.name == "sales-return") || {};
			}
		},

		methods: {
			...mapActions("Invoices", ["getAll", "changeEffectedStatus", "deleteStatus"]),

			openStatusForm(invoiceName, status) {
				this.invoiceName = invoiceName;

				this.invoiceStatus = status ? { ...status } : null;

				this.$nextTick(() => {
					this.$bvModal.show("statusFormModal");
				});
			},

			openDeleteStatusModal(invoiceName, status) {
				this.$refs.deleteModal.open({ ...status, invoiceName });
			},

			async handleDeleteStatus(data) {
				this.$refs.deleteModal.setBusy(true);

				try {
					await this.deleteStatus(data);

					this.$store.commit("showMessage", { message: this.$t("messages.deleted") });
				} catch (error) {
					console.log(error);
					this.$store.commit("showMessage", { error: true });
				} finally {
					this.$refs.deleteModal.close();
				}
			},

			handleCancelStatus(data) {
				console.log(JSON.stringify(data));
			},

			async setEffectedStatus(invoiceName, status) {
				try {
					await this.changeEffectedStatus({ ...status, invoiceName });

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
