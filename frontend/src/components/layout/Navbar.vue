<template>
	<div class="navbar-custom px-sm-2">
		<div class="toggle" @click="sidebarOpen = !sidebarOpen">
			<BarsIcon />
		</div>
		<div class="content">
			<b-dropdown variant="link" toggle-class="text-decoration-none" no-caret right size="lg" lazy menu-class="py-0">
				<template #button-content>
					<div class="user">
						<img v-if="me.image" :src="myImage" />
						<img v-else src="../../assets/default-profile.png" />
					</div>
				</template>
				<b-dd-header> {{ me.username }} </b-dd-header>
				<b-dropdown-item link-class="p-0">
					<router-link :to="{ name: 'Profile' }" class="text-dark text-decoration-none py-2 px-4 d-block"> Profile </router-link>
				</b-dropdown-item>
				<b-dropdown-item link-class="p-0">
					<router-link :to="{ name: 'Invoices' }" class="text-dark text-decoration-none py-2 px-4 d-block"> Settings </router-link>
				</b-dropdown-item>
				<hr class="m-0" />
				<b-dropdown-item-btn variant="danger" @click="logout" button-class="py-2">
					<span class="pr-1">
						<LogoutIcon color="var(--danger)" />
					</span>
					Logout
				</b-dropdown-item-btn>
			</b-dropdown>
		</div>
	</div>
</template>

<script>
	import { mapActions } from "vuex";

	import BarsIcon from "@/components/icons/bars.vue";
	import LogoutIcon from "@/components/icons/logout.vue";

	export default {
		components: { BarsIcon, LogoutIcon },

		computed: {
			sidebarOpen: {
				set(v) {
					this.$store.commit("setSidebar", v);
				},
				get() {
					return this.$store.state.sidebarOpen;
				}
			},

			myImage() {
				return `${this.BASE_URL}/images/users/${this.me.image}`;
			}
		},

		methods: {
			...mapActions({ logout: "Auth/logout" })
		}
	};
</script>

<style lang="scss">
	.navbar-custom {
		position: fixed;
		width: calc(100% - 60px);
		left: 60px;
		background: #fff;
		height: 60px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		z-index: 999;
		box-shadow: 0 0.25rem 0.5rem #00000026 !important;
		.toggle {
			position: relative;
			width: 60px;
			height: 60px;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.content {
			.user {
				position: relative;
				display: flex;
				align-items: center;
				justify-content: center;
				width: 40px;
				height: 40px;
				border-radius: 50%;
				border: 1px solid var(--primary);
				overflow: hidden;
				cursor: pointer;
				@media (min-width: 576px) {
					margin: 0 10px;
				}
				img {
					border-radius: 50%;
					width: 32px;
					height: 32px;
					object-fit: cover;
				}
			}
		}
	}
</style>
