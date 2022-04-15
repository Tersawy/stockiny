import state from "./state";
import mutations from "./mutations";
import actions from "./actions";
import getters from "./getters";
import sharededMutations from "@/store/shareded/all/mutations";
import sharededActions from "@/store/shareded/all/actions";

export default {
	state,
	getters,
	mutations: { ...sharededMutations, ...mutations },
	actions: { ...sharededActions, ...actions },
	namespaced: true
};
