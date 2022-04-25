export default {
	setAll(state, data) {
		state.all.docs = data.docs.map(doc => {
			if (typeof doc.status == "string") {
				doc.status = { _id: doc.status };
			}

			doc.status.loading = false;

			return doc;
		})

		state.all.total = data.total;
	},

	payments(state, res) {
		let invoice = state.all.docs.find((invoice) => state.one._id == invoice._id);

		if (invoice) {
			invoice.payments = res.payments;
		}

		if (state.one._id == res.invoiceId) {
			state.one = { ...state.one, payments: res.payments };
		}
	},

	setOldPayment(state, payment) { state.oldPayment = payment }
};
