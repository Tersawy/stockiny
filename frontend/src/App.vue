<template>
	<div id="app" :class="{ 'sidebar-active': sidebarOpen, 'sidebar-signed': isAuth }">
		<Sidebar v-if="isAuth" />
		<div class="main">
			<Navbar v-if="isAuth" />
			<router-view />
		</div>

		<WarehouseForm />
		<CategoryForm />
		<CustomerForm />
		<SupplierForm />
		<BrandForm />
		<CurrencyForm />
		<UnitForm />
		<ExpenseForm />
		<ExpenseCategoryForm />
	</div>
</template>

<script>
	const Navbar = () => import("@/components/layout/Navbar");

	const Sidebar = () => import("@/components/layout/Sidebar");

	const WarehouseForm = () => import("@/components/forms/WarehouseForm");

	const CategoryForm = () => import("@/components/forms/CategoryForm");

	const CustomerForm = () => import("@/components/forms/CustomerForm");

	const SupplierForm = () => import("@/components/forms/SupplierForm");

	const BrandForm = () => import("@/components/forms/BrandForm");

	const CurrencyForm = () => import("@/components/forms/CurrencyForm");

	const UnitForm = () => import("@/components/forms/UnitForm");

	const ExpenseForm = () => import("@/components/forms/ExpenseForm");

	const ExpenseCategoryForm = () => import("@/components/forms/ExpenseCategoryForm");

	export default {
		name: "App",

		components: {
			Navbar,
			Sidebar,
			WarehouseForm,
			CategoryForm,
			CustomerForm,
			SupplierForm,
			BrandForm,
			CurrencyForm,
			UnitForm,
			ExpenseForm,
			ExpenseCategoryForm
		},

		computed: {
			sidebarOpen: {
				set(v) {
					this.$store.commit("setSidebar", v);
				},
				get() {
					return this.$store.state.sidebarOpen;
				}
			}
		}
	};
</script>

<style lang="scss">
	#app {
		.main {
			position: relative;
			width: 100%;
			min-height: 100vh;
			background: #ebeef0;
			.main-content {
				position: relative;
				min-height: calc(100vh - 60px - 1.5rem);
				width: calc(100% - 60px);

				.breadcrumb-item {
					font-size: 18px;
					span.active {
						color: var(--primary);
						cursor: pointer;
						&:hover {
							text-decoration: underline;
						}
					}

					@media (max-width: 676px) {
						font-size: 14px;
						& + .breadcrumb-item {
							padding-left: 0.2rem;
							&:before {
								padding-right: 0.2rem;
							}
						}
					}
				}
			}
		}
		.main-content,
		.sidebar-custom,
		.navbar-custom {
			transition: 0.5s;
		}
		&.sidebar-signed {
			.main-content {
				width: calc(100% - 60px);
				left: 60px;
				top: 60px;
			}
			@media (max-width: 576px) {
				.main-content,
				.navbar-custom {
					width: 100%;
					left: 0;
				}
				.sidebar-custom {
					left: -100%;
					top: 60px;
					width: 300px;
				}
			}
		}
		&.sidebar-active {
			.navbar-custom {
				width: calc(100% - 300px);
				left: 300px;
			}
			.main-content {
				width: calc(100% - 300px);
				left: 300px;
			}
			.sidebar-custom {
				width: 300px;
				left: 0;
			}
			@media (max-width: 576px) {
				.navbar-custom,
				.main-content {
					width: 100%;
					left: 0;
				}
				.sidebar-custom {
					left: 0;
				}
			}
		}
	}
	.b-toaster.b-toaster-bottom-right .b-toaster-slot,
	.b-toaster.b-toaster-bottom-left .b-toaster-slot {
		max-width: 270px !important;
	}
</style>
