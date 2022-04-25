import axios from "@/plugins/axios";

export default {
	async getEdit({ commit, state }, id) {
		let data = await axios.get(`${state.prefix}/${id}/edit`);

		commit("setOne", data.doc);

		return data;
	},

	async changeStatus({ state }, { invoiceId, statusId }) {
		return axios.post(`${state.prefix}/${invoiceId}/change-status`, { statusId });
	},

	async getPayments({ commit, state }) {
		let res = await axios.get(`${state.prefix}/${state.one._id}/payments`);

		res.invoiceId = state.one._id;

		commit("payments", res);

		return res;
	},

	async createPayment({ state, dispatch }, payload) {
		let data = await axios.post(`${state.prefix}/${state.one._id}/payments`, payload);

		dispatch("getAll");

		await dispatch("getPayments");

		return data;
	},

	async updatePayment({ state, dispatch }, payload) {
		let data = await axios.put(`${state.prefix}/${state.one._id}/payments/${payload._id}`, payload);

		dispatch("getAll");

		await dispatch("getPayments");

		return data;
	},

	async removePayment({ state, dispatch }, item) {
		let data = await axios.delete(`${state.prefix}/${state.one._id}/payments/${item._id}`);

		dispatch("getAll");

		await dispatch("getPayments");

		return data;
	}
};
