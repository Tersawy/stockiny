import axios from "@/plugins/axios";

import router from "@/router";

export default {
	async login({ commit }, payload) {
		let data = await axios.post("login", payload);
		commit("login", data);
		return data;
	},

	async logout({ commit }) {
		let data = await axios.post("logout");
		commit("logout", data);
		return data;
	},

	async me({ commit }) {
		try {
			let data = await axios.get("me");
			commit("me", data);
			return data;
		} catch (e) {
			if (e.status === 401) {
				commit("unAuth");
				if (router.history.current.name !== "Login") {
					router.push({ name: "Login" });
				}
			}
		}
	},

	async resetPassword({ commit }, data) {
		let response = "This where is api action go";
		console.log(data);
		commit("resetPassword", response);
	},

	async verifiyToken({ commit }, data) {
		let response = "This where is api action go";
		console.log(data);
		commit("verifiyToken", response);
	},

	async newPassword({ commit }, data) {
		let response = "This where is api action go";
		console.log(data);
		commit("newPassword", response);
	},

	async updateProfile({ dispatch }, payload) {
		payload = (Array.isArray(payload) && payload) || [payload];

		let data = await axios.post("update-profile", ...payload);

		await dispatch("me");

		return data;
	}
};
