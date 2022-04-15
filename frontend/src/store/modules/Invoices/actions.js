import axios from "@/plugins/axios";

export default {
	async createStatus({ dispatch }, payload) {
		let data = await axios.post(`invoices/${payload.invoiceName}/statuses`, payload);

		await dispatch("getAll");

		return data;
	},

	async updateStatus({ dispatch }, payload) {
		let data = await axios.put(`invoices/${payload.invoiceName}/statuses/${payload._id}`, payload);

		await dispatch("getAll");

		return data;
	},

	async deleteStatus({ commit }, payload) {
		let data = await axios.delete(`invoices/${payload.invoiceName}/statuses/${payload._id}`);

		commit("deleteStatus", payload);

		return data;
	},

	async changeEffectedStatus({ dispatch }, payload) {
		let data = await axios.post(`invoices/${payload.invoiceName}/statuses/${payload._id}/change-effected`);

		await dispatch("getAll");

		return data;
	},

	async getStatusOptions({ commit }, invoiceName) {
		let data = await axios.get(`invoices/${invoiceName}/statuses/options`);

		data.invoiceName = invoiceName;

		commit("setStatusOptions", data);

		return data;
	}
};
