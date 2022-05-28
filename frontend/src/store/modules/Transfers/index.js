import state from "./state";
import mutations from "./mutations";
import actions from "./actions";
import sharededMutations from "@/store/shareded/all/mutations";
import sharededActions from "@/store/shareded/all/actions";
import invoicesMutations from "@/store/shareded/invoices/mutations";
import invoicesActions from "@/store/shareded/invoices/actions";

export default {
	state,
	mutations: { ...sharededMutations, ...invoicesMutations, ...mutations },
	actions: { ...sharededActions, ...invoicesActions, ...actions },
	namespaced: true
};
