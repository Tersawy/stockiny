import axios from "@/plugins/axios";

export default {
	async getEdit({ commit, state }, invoiceId) {
		let data = await axios.get(`${state.prefix}/${invoiceId}/edit`);

		commit("setOne", data.doc);

		return data;
	},

	async payments({ commit, state }) {
		let data = await axios.get(`${state.prefix}/${state.one._id}/payments`);
		commit("payments", data);
		return data;
	},

	async createPayment({ state, commit, dispatch }, payload) {
		let data = await axios.post(`${state.prefix}/${state.one._id}/payments/create`, payload);
		commit("payments", data);
		dispatch("all");
		dispatch("payments");
		return data;
	},

	async updatePayment({ state, commit, dispatch }, payload) {
		let data = await axios.put(`${state.prefix}/${state.one._id}/payments/${payload._id}`, payload);
		commit("payments", data);
		dispatch("all");
		dispatch("payments");
		return data;
	},

	async removePayment({ state, commit, dispatch }, item) {
		let data = await axios.post(`${state.prefix}/${state.one._id}/payments/${item._id}`);
		commit("payments", data);
		dispatch("all");
		dispatch("payments");
		return data;
	}
};
