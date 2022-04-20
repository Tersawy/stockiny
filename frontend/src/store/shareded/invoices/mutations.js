const payments = (state, res) => {
	let invoice = state.all.docs.find((invoice) => state.one._id == invoice._id);

	if (invoice) {
		invoice.payments = res.data;
		state.one = invoice;
	}
};

const setOldPayment = (state, payment) => (state.oldPayment = payment);

const removePayment = (state, id) => {
	let invoice = state.all.docs.find((invoice) => state.one._id == invoice._id);

	if (invoice) {
		invoice.payments = invoice.payments.filter((payment) => payment._id != id);

		state.one = invoice;
	}
};

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
	payments, setOldPayment, removePayment
};
