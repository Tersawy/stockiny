<template>
	<div class="sidebar-custom">
		<VuePerfectScrollbar class="scroll-area" v-once :settings="{ suppressScrollX: true, wheelPropagation: false }">
			<ul>
				<li>
					<router-link to="/" class="bg-transparent">
						<span class="icon logo">
							<img src="../../assets/logo.png" />
						</span>
						<h2 class="title">Stockiny</h2>
					</router-link>
				</li>
				<li v-for="(item, i) in items" :key="i">
					<router-link :to="item.to" :exact="i == 0">
						<div class="icon d-flex align-items-center justify-content-center">
							<component :is="item.icon" width="30px" v-bind="item.props" />
						</div>
						<span class="title">{{ item.title }}</span>
					</router-link>
				</li>
			</ul>
		</VuePerfectScrollbar>
	</div>
</template>

<script>
	import VuePerfectScrollbar from "vue-perfect-scrollbar";

	import DashboardIcon from "@/components/icons/dashboard.vue";
	import WarehousesIcon from "@/components/icons/warehouses.vue";
	import CategoriesIcon from "@/components/icons/categories.vue";
	import ExpensesIcon from "@/components/icons/expenses.vue";
	import ExpenseCategoriesIcon from "@/components/icons/expenseCategories.vue";
	import CustomersIcon from "@/components/icons/customers.vue";
	import SuppliersIcon from "@/components/icons/suppliers.vue";
	import BrandsIcon from "@/components/icons/brands.vue";
	import UnitsIcon from "@/components/icons/units.vue";
	import CurrenciesIcon from "@/components/icons/currencies.vue";
	import UsersIcon from "@/components/icons/users.vue";
	import ProductsIcon from "@/components/icons/products.vue";
	import SalesIcon from "@/components/icons/sales.vue";
	import SalesReturnIcon from "@/components/icons/salesReturn.vue";
	import PurchasesIcon from "@/components/icons/purchases.vue";
	import PurchasesReturnIcon from "@/components/icons/purchasesReturn.vue";
	import AdjustmentsIcon from "@/components/icons/adjustments.vue";
	import QuotationsIcon from "@/components/icons/quotations.vue";
	import TransfersIcon from "@/components/icons/transfers.vue";
	import RolesIcon from "@/components/icons/roles.vue";

	export default {
		components: { VuePerfectScrollbar },

		data() {
			return {
				items: [
					{ title: "Dashboard", icon: DashboardIcon, to: "/" },
					{ title: "Warehouses", icon: WarehousesIcon, to: "/warehouses" },
					{ title: "Categories", icon: CategoriesIcon, to: "/categories" },
					{ title: "Expenses", icon: ExpensesIcon, to: "/expenses", props: { width: "30px" } },
					{ title: "Expenses", icon: ExpenseCategoriesIcon, to: "/expense-categories" },
					{ title: "Products", icon: ProductsIcon, to: "/products" },
					{ title: "Sales", icon: SalesIcon, to: "/sales" },
					{ title: "Sales Return", icon: SalesReturnIcon, to: "/sales-return" },
					{ title: "Purchases", icon: PurchasesIcon, to: "/purchases" },
					{ title: "Purchases Return", icon: PurchasesReturnIcon, to: "/purchases-return" },
					{ title: "Adjustments", icon: AdjustmentsIcon, to: "/adjustments" },
					{ title: "Quotations", icon: QuotationsIcon, to: "/quotations" },
					{ title: "Transfers", icon: TransfersIcon, to: "/transfers" },
					{ title: "Customers", icon: CustomersIcon, to: "/customers" },
					{ title: "Suppliers", icon: SuppliersIcon, to: "/suppliers" },
					{ title: "Brands", icon: BrandsIcon, to: "/brands" },
					{ title: "Units", icon: UnitsIcon, to: "/units" },
					{ title: "Currencies", icon: CurrenciesIcon, to: "/currencies" },
					{ title: "Users", icon: UsersIcon, to: "/users" },
					{ title: "Roles", icon: RolesIcon, to: "/roles" }
				]
			};
		}
	};
</script>

<style lang="scss">
	.sidebar-custom {
		position: fixed;
		width: 60px;
		height: 100%;
		background: var(--secondary);
		overflow: auto;
		overflow-x: hidden;
		z-index: 90;
		.scroll-area {
			position: relative;
			margin: auto;
			width: 300px;
			height: 100%;
		}
		ul {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			padding: 0;
			li {
				position: relative;
				width: 100%;
				list-style: none;
				&:nth-child(1):hover {
					background: transparent;
				}
				a {
					position: relative;
					display: flex;
					width: 100%;
					text-decoration: none;
					color: #fff;
					&.router-link-active,
					&:hover {
						background: var(--primary);
					}
					.icon {
						position: relative;
						display: block;
						min-width: 60px;
						line-height: 60px;
						text-align: center;
						&.logo {
							display: flex;
							align-items: center;
							justify-content: center;
							border-radius: 50%;
							img {
								width: 40px;
								height: 40px;
							}
						}
					}
					.title {
						position: relative;
						display: block;
						padding: 0 10px;
						height: 60px;
						line-height: 60px;
						white-space: nowrap;
						&:not(h2) {
							font-size: 1.15em;
						}
					}
				}
			}
		}
	}
</style>
