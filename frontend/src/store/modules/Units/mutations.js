export default {
	baseOptions(state, data) {
		let baseOptions = state.baseOptions.slice(0, 1);
		state.baseOptions = baseOptions.concat(data.options);
	}
};
