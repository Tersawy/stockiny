export default {
	prefix: "invoices",
	all: { docs: [], total: 0 },
	one: {},
	statuses: {
		purchases: [],
		"purchases-return": [],
		sales: [],
		"sales-return": []
	},
	error: { field: "", message: { type: "" } }
};
