let me = sessionStorage.getItem("me");

try {
	me = JSON.parse(me);
} catch (e) {
	me = {};
}

const state = {
	me: me,
	token: sessionStorage.getItem("token"),
	permission: {},
	error: { field: "", message: { type: "" } }
};

export default state;
