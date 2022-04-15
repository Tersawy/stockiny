export default {
	deleteStatus(state, payload) {
		let invoice = state.all?.docs?.find((invoice) => invoice.name == payload.invoiceName);

		if (!invoice) return;

		invoice.statuses = invoice.statuses.filter((status) => status._id != payload._id);
	},

	setStatusOptions(state, data) {
		state.statuses[data.invoiceName] = data.options;
	}
};
