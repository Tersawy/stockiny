import { SALE_COMPLETED, SALE_PENDING, SALE_ORDERED } from "@/helpers/constants";

export default {
	prefix: "sales",
	statusOptions: [
		{ text: "Completed", value: SALE_COMPLETED },
		{ text: "Pending", value: SALE_PENDING },
		{ text: "Ordered", value: SALE_ORDERED }
	],
	all: { docs: [], total: 0 },
	one: { payments: [] },
	oldPayment: null,
	error: { field: "", message: { type: "" } }
};
