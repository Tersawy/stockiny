import axios from "@/plugins/axios";

export default {
	async getAll({ commit, state }, queries = "") {
		let data = await axios.get(state.prefix + queries);

		commit("setAll", data);

		return data;
	},

	async getOptions({ commit, state }) {
		let data = await axios.get(`${state.prefix}/options`);

		commit("setOptions", data);

		return data;
	},

	async getOne({ commit, state }, itemId) {
		let data = await axios.get(`${state.prefix}/${itemId}`);

		commit("setOne", data.doc);

		return data.doc;
	},

	async create({ state, dispatch }, payload) {
		payload = (Array.isArray(payload) && payload) || [payload];

		let data = await axios.post(`${state.prefix}`, ...payload);

		dispatch("getAll");

		return data;
	},

	async update({ state, dispatch }, payload) {
		payload = Array.isArray(payload) ? payload : [payload];

		let data = await axios.put(`${state.prefix}/${state.one._id}`, ...payload);

		dispatch("getAll");

		return data;
	},

	async moveToTrash({ commit, state, dispatch }, item) {
		let data = await axios.delete(`${state.prefix}/${item._id}`);

		commit("remove", item._id);

		dispatch("getAll");

		return data;
	},

	async trashed({ commit, state }) {
		let data = await axios.get(`${state.prefix}/trashed`);

		commit("setAll", data);

		return data;
	},

	async restore({ commit, state }, payload) {
		let data = await axios.post(`${state.prefix}/${payload._id}/restore`);

		commit("remove", payload._id);

		return data;
	},

	async remove({ commit, state }, payload) {
		let data = await axios.post(`${state.prefix}/${payload._id}`);

		commit("remove", payload._id);

		return data;
	}
};
