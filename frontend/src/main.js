import Vue from "vue";
import App from "@/App";
import router from "@/router";

import "@fortawesome/fontawesome-free/js/all";
import "@fortawesome/fontawesome-free/css/all.css";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

import i18n from "./plugins/i18n";

import "@/assets/scss/main.scss";

import userMixin from "./mixins/userMixin";
Vue.mixin(userMixin);

import store from "@/store";
Vue.prototype.$store = store;

import $axios from "@/plugins/axios";
Vue.prototype.$axios = $axios;

import MainContent from "@/components/layout/MainContent";
Vue.component("MainContent", MainContent);

Vue.config.productionTip = false;

const DEFAULT_TITLE = "Stockiny";

router.afterEach((to) => {
	Vue.nextTick(() => {
		document.title = to.meta.title || DEFAULT_TITLE;
	});
});

router.beforeEach(async (to, _from, next) => {
	let me = store.state.Auth.me;

	me = me || sessionStorage.getItem("me") || {};

	me = typeof me === "object" ? me : JSON.parse(me);

	let isUser = Object.keys(me).length > 1;

	if (to.meta.auth) {
		if (isUser) {
			if (to.name == "Dashboard") return next();

			if (me.isOwner) return next();

			if (to.meta.permissions && to.meta.permissions.length) {
				let hasPermission = false;

				for (let permission of to.meta.permissions) {
					if (me.permissions.includes(permission)) {
						hasPermission = true;
						break;
					}
				}

				if (hasPermission) return next();
			}

			return next({ name: "Dashboard" });
		} else {
			next({ name: "Login" });
		}
	}

	if (isUser && to.name === "Login") {
		if (to.name == "Dashboard") return;
		next({ name: "Dashboard" });
	}

	next();
});

import "./directives";
import "./filters";

new Vue({
	store,
	router,
	i18n,
	render: (h) => h(App)
}).$mount("#app");

store.dispatch("Auth/me");
