import { PURCHASE_RECEIVED, PURCHASE_PENDING, PURCHASE_ORDERED } from "@/helpers/constants";

export default {
	prefix: "purchases",
	statusOptions: [
		{ text: "Received", value: PURCHASE_RECEIVED },
		{ text: "Pending", value: PURCHASE_PENDING },
		{ text: "Ordered", value: PURCHASE_ORDERED }
	],
	all: { docs: [], total: 0 },
	one: { payments: [] },
	oldPayment: null,
	error: { field: "", message: { type: "" } }
};
