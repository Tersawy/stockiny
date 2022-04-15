// import { showToast } from "@/components/ui/utils";

export default {
	setAll(state, data) {
		state.all.docs = data.docs;
		state.all.total = data.total;
	},

	setOptions(state, data) {
		let options = state.options.slice(0, 1);
		state.options = options.concat(data.options);
	},

	setOne(state, doc) {
		state.one = doc;
	},

	updateOne(state, doc = {}) {
		for (let key in doc) {
			state.one[key] = doc[key];
		}

		state.one.updatedAt = doc.updatedAt || new Date();

		state.one.updatedBy = doc.updatedBy || { ...this.state.Auth.me };
	},

	remove(state, id) {
		state.all.docs = state.all.docs.filter((doc) => doc._id != id);
	},

	setError(state, error = { field: "", message: { type: "" } }) {
		state.error = error;
	},

	resetError(state) {
		state.error = { field: "", message: { type: "" } };
	},

	resetErrorByField(state, field) {
		if (state.error.field == field) {
			state.error = { field: "", message: { type: "" } };
		}
	}
};
