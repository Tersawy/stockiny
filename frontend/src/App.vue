<template>
	<div id="app" :class="{ 'sidebar-active': sidebarOpen, 'sidebar-signed': isAuth }">
		<Sidebar v-if="isAuth" />
		<div class="main">
			<Navbar v-if="isAuth" />
			<transition :name="transitionName" mode="out-in" :duration="duration">
				<router-view />
			</transition>
		</div>

		<template v-if="isAuth">
			<WarehouseForm />
			<CategoryForm />
			<CustomerForm />
			<SupplierForm />
			<BrandForm />
			<CurrencyForm />
			<UnitForm />
			<ExpenseForm />
			<ExpenseCategoryForm />
		</template>
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

	data() {
		return {
			transitionName: "slide-right",
			duration: { enter: 100, leave: 50 }
		};
	},

	watch: {
		$route(to, from) {
			const toDepth = to.path.split("/").length;

			const fromDepth = from.path.split("/").length;

			if (toDepth > fromDepth) {
				this.transitionName = "slide-left";
				this.duration = { enter: 100, leave: 50 };
			} else if (toDepth < fromDepth) {
				this.transitionName = "slide-right";
				this.duration = { enter: 100, leave: 50 };
			} else {
				if (to.path == "/" || from.path == "/") {
					this.transitionName = "slide-top";
					this.duration = { enter: 300, leave: 150 };
				} else {
					this.transitionName = "slide-fade";
					this.duration = { enter: 100, leave: 50 };
				}
			}
		}
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
		overflow-x: hidden;
		.main-content {
			position: relative;
			min-height: calc(100vh - 60px - 1.5rem);
			width: calc(100% - 60px);
			opacity: 1;

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
			padding-bottom: 60px;
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

.slide-right-enter-active {
	animation: fromLeft 0.1s;
}

.slide-right-leave-active {
	animation: toRight 0.1s;
}

.slide-left-enter-active {
	animation: fromRight 0.1s;
}

.slide-left-leave-active {
	animation: toLeft 0.1s;
}

.slide-top-enter-active {
	animation: fromTop 0.2s;
}

.slide-top-leave-active {
	animation: toBottom 0.2s;
}

.slide-fade-enter-active {
	animation: fadeFromTop 0.1s;
}

.slide-fade-leave-active {
	animation: fadeToTop 0.1s;
}

@keyframes toRight {
	from {
		transform: translateX(0);
		opacity: 1;
	}
	to {
		transform: translateX(80%);
		opacity: 0;
	}
}

@keyframes fromLeft {
	from {
		transform: translateX(-80%);
		opacity: 0;
	}
	to {
		transform: translateX(0);
		opacity: 1;
	}
}

@keyframes toLeft {
	from {
		transform: translateX(0);
		opacity: 1;
	}
	to {
		transform: translateX(-80%);
		opacity: 0;
	}
}

@keyframes fromRight {
	from {
		transform: translateX(80%);
		opacity: 0;
	}
	to {
		transform: translateX(0);
		opacity: 1;
	}
}

@keyframes fromTop {
	from {
		transform: translateY(-80%);
		opacity: 0;
	}
	to {
		transform: translateY(0);
		opacity: 1;
	}
}

@keyframes toBottom {
	from {
		transform: translateY(0);
		opacity: 1;
	}
	to {
		transform: translateY(80%);
		opacity: 0;
	}
}

@keyframes fadeFromTop {
	from {
		transform: translateY(-80px);
		opacity: 0;
	}
	to {
		transform: translateY(0);
		opacity: 1;
	}
}
@keyframes fadeToTop {
	from {
		transform: translateY(0);
		opacity: 1;
	}
	to {
		transform: translateY(-80px);
		opacity: 0;
	}
}
</style>
