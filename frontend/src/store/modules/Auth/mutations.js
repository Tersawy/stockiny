import router from "@/router";

export default {
	login(state, data) {
		state.me = data.me;
		state.token = data.token;
		sessionStorage.setItem("me", JSON.stringify(data.me));
		sessionStorage.setItem("token", data.token);

		return router.push({ name: "Dashboard" });
	},

	me(state, me) {
		state.me = me;
		sessionStorage.setItem("me", JSON.stringify(me));
	},

	setAuth(state) {
		state.token = sessionStorage.getItem("token");
		state.me = sessionStorage.getItem("me") ? JSON.parse(sessionStorage.getItem("me")) : {};
	},

	unAuth(state) {
		state.me = {};
		state.token = null;
		sessionStorage.removeItem("me");
		sessionStorage.removeItem("token");
	},

	logout(state) {
		state.me = {};
		state.token = null;
		sessionStorage.removeItem("me");
		sessionStorage.removeItem("token");
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
