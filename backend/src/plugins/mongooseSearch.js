module.exports = (schema) => {
	schema.query.withSearch = function (options = {}) {
		let defaultOptions = { search: null, searchIn: null };

		options = { ...defaultOptions, ...options };

		let { search, searchIn } = options;

		let paths = Object.keys(this.schema.paths).filter((path) => this.schema.paths[path].instance == "String");

		if (search) {
			if (Array.isArray(searchIn) && searchIn.length) {
				searchIn = searchIn.filter((field) => paths[field]);
				searchIn = searchIn.length ? searchIn : paths;
			} else if (typeof searchIn == "string") {
				searchIn = searchIn.split(",");
				searchIn = searchIn.filter((field) => paths.includes(field));
				searchIn = searchIn.length ? searchIn : paths;
			} else {
				searchIn = paths;
			}

			let $or = searchIn.map((field) => ({ [field]: { $regex: search, $options: "i" } }));

			return this.where({ $or });
		}

		return this;
	};
};
