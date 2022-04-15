import { mapState } from "vuex";

const userMixin = {
	computed: {
		...mapState("Auth", ["me"]),

		isAuth() {
			return this.me && Object.keys(this.me).length > 0;
		},

		BASE_URL() {
			return process.env.VUE_APP_BASE_URL;
		},

		APP_PRODUCTS_URL() {
			return process.env.VUE_APP_BASE_URL + "images/products/";
		},

		APP_BRANDS_URL() {
			return process.env.VUE_APP_BASE_URL + "images/brands/";
		}
	},

	methods: {
		hasPermission(...permissions) {
			if (!this.isAuth) return false;

			if (this.me.isOwner) return true;

			return permissions.every((permission) => this.me.permissions.includes(permission));
		},

		hasAnyPermission(...permissions) {
			if (!this.isAuth) return false;

			if (this.me.isOwner) return true;

			return permissions.some((permission) => this.me.permissions.includes(permission));
		}
	}
};

export default userMixin;
