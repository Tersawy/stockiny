import axios from "@/plugins/axios";

export default {
	changeActivation({ state }, userId) {
		return axios.put(`${state.prefix}/${userId}/change-activation`);
	}
};
