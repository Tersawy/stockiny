import jsCookie from "js-cookie";

let me = jsCookie.get("me");

try {
	me = JSON.parse(me);
} catch (e) {
	me = {};
}

const state = {
	me: me,
	token: jsCookie.get("token"),
	permission: {},
	error: { field: "", message: { type: "" } }
};

export default state;
