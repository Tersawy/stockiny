export default {
	subUnitOptions: (state) => (unitId) => {
		let base = state.options.find((option) => option._id && option._id == unitId);

		if (!base) return [];

		return base.subUnits;
	}
};
