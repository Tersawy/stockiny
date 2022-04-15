import Vue from "vue";
import { PAYMENT_METHODS_STR } from "@/helpers/constants";

Vue.filter("relation", function (value, key) {
	if (!value) return "- - -";

	if (typeof value === "string") return value;

	if (typeof value === "object") {
		if (typeof key !== "undefined" && value[key] !== "undefined") {
			return value[key];
		} else {
			return value.name;
		}
	}
});

Vue.filter("floating", function (value, num = 2) {
	value = value ? value : 0;

	let [f, l] = value.toString().split(".");

	if (!l) return `${f}.${Array(num).fill(0).join("")}`;

	if (l.length < num) {
		return `${f}.${l.slice(0, num)}${Array(num - l.length)
			.fill(0)
			.join("")}`;
	}

	return `${f}.${l.slice(0, num)}`;
});

Vue.filter("toSentenceCase", function (value, delimiter = "[A-Z]") {
	if (!value) return "";

	let regex = new RegExp(`(${delimiter})`, "g");

	return value
		.toString()
		.replace(regex, " $1")
		.replace(/^./, function (str) {
			return str.toLowerCase().toUpperCase();
		});
});

Vue.filter("paymentMethod", (value) => PAYMENT_METHODS_STR[value]);

Vue.filter("simpleDate", (value) => {
	if (!value) return "- - -";

	let date = new Date(value);

	return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
});

Vue.filter("date", (date) => {
	if (!date) return "- - -";

	date = new Date(date);

	let dateString = date.toLocaleDateString();

	let timeString = date.toLocaleTimeString().replace(/:\d+ /, " ");

	let day = date.toDateString().split(" ")[0];

	date = day + ", " + dateString + ", " + timeString;

	return date;
});
