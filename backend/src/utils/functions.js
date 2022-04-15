exports.randomChar = (num = 8) => {
	let chars = "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

	let random = "";

	for (let i = 0; i < num; i++) {
		random += chars[Math.floor(Math.random() * chars.length)];
	}

	return random;
};

exports.handleQueries = (req, Model, searchOptions = { isSearch: false, fields: null }) => {
	const { page = 1, perPage = 10, search = "", sortBy = "createdAt", sortDir = "desc" } = req.query;

	const attributes = Model ? Object.keys(Model.schema.paths) : [];

	const sortDirections = ["asc", "desc"];

	req.query.sortDir = sortDirections.includes(sortDir) ? sortDir : "desc";

	req.query.sortBy = attributes.includes(sortBy) ? sortBy : "createdAt";

	req.query.page = +(/^\d+$/.test(page) ? +page : 1);

	req.query.perPage = +(/^\d+$/.test(perPage) ? +perPage : 10);

	req.query.sort = { [req.query.sortBy]: req.query.sortDir };

	req.query.skip = (req.query.page - 1) * req.query.perPage;

	req.query.limit = req.query.perPage;

	if (typeof searchOptions == "object" && searchOptions.isSearch) {
		searchOptions.fields = searchOptions.fields || attributes;

		req.query.search = {};

		req.query.search.$or = searchOptions.fields.map((field) => {
			return { [field]: { $regex: search, $options: "i" } };
		});
	}

	return req.query;
};
