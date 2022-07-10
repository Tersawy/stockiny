import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [
	{
		path: "/login",
		name: "Login",
		component: () => /* webpackChunkName: "Login" */ import("@/views/Auth/login"),
		meta: { auth: false }
	},
	{
		path: "/profile",
		name: "Profile",
		component: () => /* webpackChunkName: "Profile" */ import("@/views/Auth/profile"),
		meta: { auth: false }
	},
	{
		path: "/",
		name: "Dashboard",
		component: () => /* webpackChunkName: "Dashboard" */ import("@/views/Dashboard"),
		meta: { auth: true, permissions: [] }
	},
	{
		path: "/warehouses",
		name: "Warehouses",
		component: () => /* webpackChunkName: "Warehouses" */ import("@/views/Warehouses"),
		meta: { auth: true, permissions: ["read:warehouses"] }
	},
	{
		path: "/categories",
		name: "Categories",
		component: () => /* webpackChunkName: "Categories" */ import("@/views/Categories/index"),
		meta: { auth: true, permissions: ["read:categories"] }
	},
	{
		path: "/expenses",
		name: "Expenses",
		component: () => /* webpackChunkName: "Expenses" */ import("@/views/Expenses/index"),
		meta: { auth: true, permissions: ["read:expenses"] }
	},
	{
		path: "/expense-categories",
		name: "ExpenseCategories",
		component: () => /* webpackChunkName: "ExpenseCategories" */ import("@/views/ExpenseCategories/index"),
		meta: { auth: true, permissions: ["read:expenseCategories"] }
	},
	{
		path: "/products",
		name: "Products",
		component: () => /* webpackChunkName: "Products" */ import("@/views/Products/index"),
		meta: { auth: true, permissions: ["read:products"] }
	},
	{
		path: "/products/create",
		name: "ProductCreate",
		component: () => /* webpackChunkName: "ProductCreate" */ import("@/views/Products/productForm"),
		meta: { auth: true, permissions: ["create:products"] }
	},
	{
		path: "/products/:productId",
		name: "Product",
		component: () => /* webpackChunkName: "Product" */ import("@/views/Products/product"),
		meta: { auth: true, permissions: ["show:product", "edit:products"] }
	},
	{
		path: "/products/:productId/edit",
		name: "ProductEdit",
		component: () => /* webpackChunkName: "ProductEdit" */ import("@/views/Products/productForm"),
		meta: { auth: true, permissions: ["edit:products"] }
	},
	{
		path: "/sales",
		name: "Sales",
		component: () => /* webpackChunkName: "Sales" */ import("@/views/Sales/index"),
		meta: { auth: true, permissions: ["read:sales"] }
	},
	{
		path: "/sales/create",
		name: "SaleCreate",
		component: () => /* webpackChunkName: "SaleCreate" */ import("@/views/Sales/saleForm"),
		meta: { auth: true, permissions: ["create:sales"] }
	},
	{
		path: "/sales/:id/edit",
		name: "SaleEdit",
		component: () => /* webpackChunkName: "SaleEdit" */ import("@/views/Sales/saleForm"),
		meta: { auth: true, permissions: ["edit:sales"] }
	},
	{
		path: "/sales/:id",
		name: "Sale",
		component: () => /* webpackChunkName: "Sale" */ import("@/views/Sales/sale"),
		meta: { auth: true, permissions: ["show:sales"] }
	},
	{
		path: "/sales-return",
		name: "SalesReturn",
		component: () => /* webpackChunkName: "SalesReturn" */ import("@/views/SalesReturn/index"),
		meta: { auth: true, permissions: ["read:salesReturn"] }
	},
	{
		path: "/sales-return/create",
		name: "SaleReturnCreate",
		component: () => /* webpackChunkName: "SaleReturnCreate" */ import("@/views/SalesReturn/saleReturnForm"),
		meta: { auth: true, permissions: ["create:salesReturn"] }
	},
	{
		path: "/sales-return/:id/edit",
		name: "SaleReturnEdit",
		component: () => /* webpackChunkName: "SaleReturnEdit" */ import("@/views/SalesReturn/saleReturnForm"),
		meta: { auth: true, permissions: ["edit:salesReturn"] }
	},
	{
		path: "/sales-return/:id",
		name: "SaleReturn",
		component: () => /* webpackChunkName: "SaleReturn" */ import("@/views/SalesReturn/saleReturn"),
		meta: { auth: true, permissions: ["show:salesReturn"] }
	},
	{
		path: "/purchases",
		name: "Purchases",
		component: () => /* webpackChunkName: "Purchases" */ import("@/views/Purchases/index"),
		meta: { auth: true, permissions: ["read:purchases"] }
	},
	{
		path: "/purchases/create",
		name: "PurchaseCreate",
		component: () => /* webpackChunkName: "PurchaseCreate" */ import("@/views/Purchases/purchaseForm"),
		meta: { auth: true, permissions: ["create:purchases"] }
	},
	{
		path: "/purchases/:id/edit",
		name: "PurchaseEdit",
		component: () => /* webpackChunkName: "PurchaseEdit" */ import("@/views/Purchases/purchaseForm"),
		meta: { auth: true, permissions: ["edit:purchases"] }
	},
	{
		path: "/purchases/:id",
		name: "Purchase",
		component: () => /* webpackChunkName: "Purchase" */ import("@/views/Purchases/purchase"),
		meta: { auth: true, permissions: ["show:purchases"] }
	},
	{
		path: "/purchases-return",
		name: "PurchasesReturn",
		component: () => /* webpackChunkName: "PurchasesReturn" */ import("@/views/PurchasesReturn/index"),
		meta: { auth: true, permissions: ["read:purchasesReturn"] }
	},
	{
		path: "/purchases-return/create",
		name: "PurchaseReturnCreate",
		component: () => /* webpackChunkName: "PurchaseReturnCreate" */ import("@/views/PurchasesReturn/purchaseReturnForm"),
		meta: { auth: true, permissions: ["create:purchasesReturn"] }
	},
	{
		path: "/purchases-return/:id/edit",
		name: "PurchaseReturnEdit",
		component: () => /* webpackChunkName: "PurchaseReturnEdit" */ import("@/views/PurchasesReturn/purchaseReturnForm"),
		meta: { auth: true, permissions: ["edit:purchasesReturn"] }
	},
	{
		path: "/purchases-return/:id",
		name: "PurchaseReturn",
		component: () => /* webpackChunkName: "PurchaseReturn" */ import("@/views/PurchasesReturn/purchaseReturn"),
		meta: { auth: true, permissions: ["show:purchasesReturn"] }
	},
	{
		path: "/transfers",
		name: "Transfers",
		component: () => /* webpackChunkName: "Transfers" */ import("@/views/Transfers/index"),
		meta: { auth: true, permissions: ["read:transfers"] }
	},
	{
		path: "/transfers/create",
		name: "TransferCreate",
		component: () => /* webpackChunkName: "TransferCreate" */ import("@/views/Transfers/transferForm"),
		meta: { auth: true, permissions: ["create:transfers"] }
	},
	{
		path: "/transfers/:id/edit",
		name: "TransferEdit",
		component: () => /* webpackChunkName: "TransferEdit" */ import("@/views/Transfers/transferForm"),
		meta: { auth: true, permissions: ["edit:transfers"] }
	},
	{
		path: "/transfers/:id",
		name: "Transfer",
		component: () => /* webpackChunkName: "Transfer" */ import("@/views/Transfers/transfer"),
		meta: { auth: true, permissions: ["show:transfers"] }
	},
	{
		path: "/adjustments",
		name: "Adjustments",
		component: () => /* webpackChunkName: "Adjustments" */ import("@/views/Adjustments/index"),
		meta: { auth: true, permissions: ["read:adjustments"] }
	},
	{
		path: "/adjustments/create",
		name: "AdjustmentCreate",
		component: () => /* webpackChunkName: "AdjustmentCreate" */ import("@/views/Adjustments/adjustmentForm"),
		meta: { auth: true, permissions: ["create:adjustments"] }
	},
	{
		path: "/adjustments/:id/edit",
		name: "AdjustmentEdit",
		component: () => /* webpackChunkName: "AdjustmentEdit" */ import("@/views/Adjustments/adjustmentForm"),
		meta: { auth: true, permissions: ["edit:adjustments"] }
	},
	{
		path: "/adjustments/:id",
		name: "Adjustment",
		component: () => /* webpackChunkName: "Adjustment" */ import("@/views/Adjustments/adjustment"),
		meta: { auth: true, permissions: ["show:adjustments"] }
	},
	{
		path: "/quotations",
		name: "Quotations",
		component: () => /* webpackChunkName: "Quotations" */ import("@/views/Quotations/index"),
		meta: { auth: true, permissions: ["read:quotations"] }
	},
	{
		path: "/quotations/create",
		name: "QuotationCreate",
		component: () => /* webpackChunkName: "QuotationCreate" */ import("@/views/Quotations/quotationForm"),
		meta: { auth: true, permissions: ["create:quotations"] }
	},
	{
		path: "/quotations/:id/edit",
		name: "QuotationEdit",
		component: () => /* webpackChunkName: "QuotationEdit" */ import("@/views/Quotations/quotationForm"),
		meta: { auth: true, permissions: ["edit:quotations"] }
	},
	{
		path: "/quotations/:id",
		name: "Quotation",
		component: () => /* webpackChunkName: "Quotation" */ import("@/views/Quotations/quotation"),
		meta: { auth: true, permissions: ["show:quotations"] }
	},
	{
		path: "/invoices",
		name: "Invoices",
		component: () => /* webpackChunkName: "Invoices" */ import("@/views/Invoices/index"),
		meta: { auth: true, permissions: [] }
	},
	{
		path: "/customers",
		name: "Customers",
		component: () => /* webpackChunkName: "Customers" */ import("@/views/Customers/index"),
		meta: { auth: true, permissions: ["read:customers"] }
	},
	{
		path: "/suppliers",
		name: "Suppliers",
		component: () => /* webpackChunkName: "Suppliers" */ import("@/views/Suppliers/index"),
		meta: { auth: true, permissions: ["read:suppliers"] }
	},
	{
		path: "/brands",
		name: "Brands",
		component: () => /* webpackChunkName: "Brands" */ import("@/views/Brands/index"),
		meta: { auth: true, permissions: ["read:brands"] }
	},
	{
		path: "/units",
		name: "Units",
		component: () => /* webpackChunkName: "Units" */ import("@/views/Units/index"),
		meta: { auth: true, permissions: ["read:units"] }
	},
	{
		path: "/currencies",
		name: "Currencies",
		component: () => /* webpackChunkName: "Currencies" */ import("@/views/Currencies/index"),
		meta: { auth: true, permissions: ["read:currencies"] }
	},
	{
		path: "/users",
		name: "Users",
		component: () => /* webpackChunkName: "Users" */ import("@/views/Users/index"),
		meta: { auth: true, permissions: ["read:users"] }
	},
	{
		path: "/users/create",
		name: "UserCreate",
		component: () => /* webpackChunkName: "UserCreate" */ import("@/views/Users/userForm"),
		meta: { auth: true, permissions: ["create:users"] }
	},
	{
		path: "/users/:userId/edit",
		name: "UserEdit",
		component: () => /* webpackChunkName: "UserEdit" */ import("@/views/Users/userForm"),
		meta: { auth: true, permissions: ["edit:users"] }
	},
	{
		path: "/roles",
		name: "Roles",
		component: () => /* webpackChunkName: "Roles" */ import("@/views/Roles/index"),
		meta: { auth: true, permissions: ["read:roles"] }
	},
	{
		path: "/roles/create",
		name: "RoleCreate",
		component: () => /* webpackChunkName: "RoleCreate" */ import("@/views/Roles/roleForm"),
		meta: { auth: true, permissions: ["create:roles"] }
	},
	{
		path: "/roles/:roleId/edit",
		name: "RoleEdit",
		component: () => /* webpackChunkName: "RoleEdit" */ import("@/views/Roles/roleForm"),
		meta: { auth: true, permissions: ["edit:roles"] }
	},
	{
		path: "/settings",
		name: "Settings",
		component: () => /* webpackChunkName: "Settings" */ import("@/views/Settings/index"),
		meta: { auth: true, permissions: [] }
	}
];

const router = new VueRouter({
	mode: "history",
	base: process.env.BASE_URL,
	routes
});

export default router;
