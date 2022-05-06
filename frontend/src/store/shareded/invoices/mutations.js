export default {
	setAll(state, data) {
		state.all.docs = data.docs.map(doc => {
			if (!doc.status) {
				doc.status = { name: "Draft", color: "grey", loading: false };
				return doc;
			}

			if (typeof doc.status == "string") {
				doc.status = { _id: doc.status };
			}

			doc.status.loading = false;

			return doc;
		})

		state.all.total = data.total;
	},

	setOne(state, doc) {
		if (doc._id == state.one._id) {
			state.one = { ...state.one, ...doc };
		} else {
			state.one = doc;
		}
	},

	deleteStatus(state, payload) {
		state.statuses = state.statuses.filter((status) => status._id != payload._id);
	},

	setStatuses(state, data) {
		state.statuses = data.statuses;
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
