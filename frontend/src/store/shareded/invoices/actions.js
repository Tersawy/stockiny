import axios from "@/plugins/axios";

export default {
	async getStatuses({ commit, state }) {
		let data = await axios.get(`${state.prefix}/statuses`);

		commit("setStatuses", data);

		return data;
	},

	async createStatus({ dispatch, state }, payload) {
		let data = await axios.post(`${state.prefix}/statuses`, payload);

		await dispatch("getStatuses");

		return data;
	},

	async updateStatus({ dispatch, state }, payload) {
		let data = await axios.put(`${state.prefix}/statuses/${payload._id}`, payload);

		await dispatch("getStatuses");

		return data;
	},

	async deleteStatus({ commit, state }, payload) {
		let data = await axios.delete(`${state.prefix}/statuses/${payload._id}`);

		commit("deleteStatus", payload);

		return data;
	},

	async changeEffectedStatus({ dispatch, state }, payload) {
		let data = await axios.post(`${state.prefix}/statuses/${payload._id}/change-effected`);

		await dispatch("getStatuses");

		return data;
	},

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
