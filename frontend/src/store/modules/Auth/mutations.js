import router from "@/router";

import jsCookie from "js-cookie";

export default {
	login(state, data) {
		state.me = data.me;
		state.token = data.token;
		jsCookie.set("me", JSON.stringify(data.me));
		jsCookie.set("token", data.token);

		return router.push({ name: "Dashboard" });
	},

	me(state, me) {
		state.me = me;
		jsCookie.set("me", JSON.stringify(me));
	},

	setAuth(state) {
		state.token = jsCookie.get("token");
		state.me = jsCookie.get("me") ? JSON.parse(jsCookie.get("me")) : {};
	},

	unAuth(state) {
		state.me = {};
		state.token = null;
		jsCookie.remove("me");
		jsCookie.remove("token");
	},

	logout(state) {
		state.me = {};
		state.token = null;
		jsCookie.remove("me");
		jsCookie.remove("token");
		router.push("/login");
	},

	resetPassword(state, data) {
		console.log(data);
	},

	verifiyToken(state, data) {
		console.log(data);
	},

	newPassword(state, data) {
		console.log(data);
	},

	updateProfile(state, data) {
		console.log(data);
	},

	setError(state, error) {
		state.error = error;
	},

	resetError(state) {
		state.error = { field: "", message: { type: "" } };
	},

	resetErrorByField(state, field) {
		if (state.error.field == field) {
			state.error = { field: "", message: { type: "" } };
		}
	}
};
