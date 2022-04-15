import axios from "@/plugins/axios";

export default {
	async getBaseOptions({ state, commit }) {
		let data = await axios.get(`${state.prefix}/base-options`);
		commit("baseOptions", data);
		return data;
	}
};
