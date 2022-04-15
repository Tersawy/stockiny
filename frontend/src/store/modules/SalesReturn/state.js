import { SALE_RETURN_RECEIVED, SALE_RETURN_PENDING } from "@/helpers/constants";

export default {
	prefix: "sales-return",
	statusOptions: [
		{ text: "Received", value: SALE_RETURN_RECEIVED },
		{ text: "Pending", value: SALE_RETURN_PENDING }
	],
	all: { docs: [], total: 0 },
	one: { payments: [] },
	oldPayment: null,
	error: { field: "", message: { type: "" } }
};
