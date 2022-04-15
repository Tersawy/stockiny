import { PURCHASE_RETURN_COMPLETED, PURCHASE_RETURN_PENDING } from "@/helpers/constants";

export default {
	prefix: "purchases-return",
	statusOptions: [
		{ text: "Completed", value: PURCHASE_RETURN_COMPLETED },
		{ text: "Pending", value: PURCHASE_RETURN_PENDING }
	],
	all: { docs: [], total: 0 },
	one: { payments: [] },
	oldPayment: null,
	error: { field: "", message: { type: "" } }
};
