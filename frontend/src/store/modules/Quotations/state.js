import { QUOTATION_SENT, QUOTATION_PENDING } from "@/helpers/constants";

export default {
	prefix: "quotations",
	statusOptions: [
		{ text: "Sent", value: QUOTATION_SENT },
		{ text: "Pending", value: QUOTATION_PENDING }
	],
	all: { docs: [], total: 0 },
	one: {},
	error: { field: "", message: { type: "" } }
};
