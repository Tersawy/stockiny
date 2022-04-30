import { mapActions, mapMutations } from "vuex";

import { getCode } from "@/helpers";

const TableHeaderControls = () => import("@/components/TableHeaderControls");

const TableFooterControls = () => import("@/components/TableFooterControls");

const DeleteModal = () => import("@/components/DeleteModal");

import EditIcon from "@/components/icons/edit.vue";

import TrashIcon from "@/components/icons/trash.vue";

import axios from "@/plugins/axios";

import { showMessage } from "@/components/utils";

export default function dataTableMixin(namespace) {
	return {
		components: { TableHeaderControls, TableFooterControls, DeleteModal, EditIcon, TrashIcon },

		data: () => ({
			perPageOptions: [10, 20, 30, 40, 50],
			tableIsBusy: false,
			perPage: 10,
			page: 1,
			sortBy: "createdAt",
			sortDesc: true,
			search: ""
		}),

		async beforeRouteEnter(to, from, next) {
			// transform namespace from camelCase to kebab-case
			let routename = namespace.replace(/\B([A-Z])/g, "-$1").toLowerCase();

			let response = await axios.get(`/${routename}`);

			next(vm => vm.$store.commit(`${namespace}/setAll`, response))
		},

		mounted() {
			// this.getAll(this.queries);
			if (this.formId) {
				// open modal when press alt+c
				document.onkeydown = (e) => {
					if (e.altKey && +getCode(e) === 67) {
						this.$root.$emit("bv::toggle::modal", this.formId);
					}
				};
			}
		},

		computed: {
			items() {
				return this.$store.state[namespace].all.docs;
			},

			docsCount() {
				return this.$store.state[namespace].all.total;
			},

			tableControls() {
				let that = this;
				return {
					get search() {
						return that.search;
					},

					set search(value) {
						that.search = value;
					},

					get perPageOptions() {
						return that.perPageOptions;
					},

					get docsCount() {
						return that.docsCount;
					},

					get perPage() {
						return that.perPage;
					},

					set perPage(value) {
						that.perPage = value;
					},

					get page() {
						return that.page;
					},

					set page(value) {
						that.page = value;
					},

					get sortBy() {
						return that.sortBy;
					},

					set sortBy(value) {
						that.sortBy = value;
					},

					get sortDesc() {
						return that.sortDesc;
					},

					set sortDesc(value) {
						that.sortDesc = value;
					},

					get searchIn() {
						return that.searchIn;
					},

					set searchIn(value) {
						that.searchIn = value;
					}
				};
			},

			dirSort() {
				return this.sortDesc ? "desc" : "asc";
			},

			fieldSort() {
				return this.sortBy == "image" ? "_id" : this.sortBy;
			},

			queries() {
				let queries = `?page=${this.page}&perPage=${this.perPage}&search=${this.search}&sortBy=${this.fieldSort}&sortDir=${this.dirSort}`;

				for (let field in this.filterationFields) {
					queries += `&${field}=${this.filterationFields[field]}`;
				}

				queries += "&searchIn=";

				for (let field in this.searchIn) {
					if (this.searchIn[field]) {
						queries += `${field},`;
					}
				}

				return queries;
			}
		},

		watch: {
			search() {
				this.page = 1;
				this.sortBy = "createdAt";
				this.sortDesc = true;
			},
			page() {
				this.finallData();
			},
			perPage() {
				this.page = 1;
			},
			searchIn: {
				handler() {
					this.getAll(this.queries);
				},
				deep: true
			}
		},

		methods: {
			...mapActions(namespace, ["getAll"]),

			...mapMutations(namespace, ["setOne"]),

			contextChanged(ctx) {
				this.sortBy = ctx.sortBy;
				this.sortDesc = ctx.sortDesc;
				this.finallData();
			},

			finallData() {
				this.tableIsBusy = true;

				this.getAll(this.queries);

				this.$nextTick(() => {
					this.tableIsBusy = false;
				});
			},

			edit(item) {
				this.setOne({ ...item });

				this.$nextTick(() => {
					this.$bvModal.show(this.formId);
				});
			},

			toTrash(item) {
				this.$refs.deleteModal.open(item);
			},

			async moveToTrash(item) {
				try {
					this.$refs.deleteModal.setBusy(true);

					await this.$store.dispatch(`${namespace}/moveToTrash`, item);

					showMessage({ message: this.$t("messages.deleted") });
				} catch (e) {
					if (e.status == 400) {
						showMessage({ error: true, message: this.$t(`messages.${e.message}`) });
					} else if (e.status == 404) {
						this.$store.commit(`${namespace}/remove`, item._id);
						showMessage({ message: this.$t("messages.deleted") });
					} else {
						showMessage({ error: true });
					}
				} finally {
					this.$refs.deleteModal.close();
				}
			},

			btnCreateClicked() {
				this.$bvModal.show(this.formId);
			},

			btnImportClicked() {
				this.$bvModal.show(this.formId);
			},

			btnExcelClicked() {
				this.$bvModal.show(this.formId);
			},

			btnPdfClicked() {
				window.print();
			}
		}
	};
}
