module.exports = (schema) => {
	schema.query.withFilter = function (options = {}) {
		let defaultOptions = { filterationFields: [], query: {} };

		let { filterationFields: fields, query } = { ...defaultOptions, ...options };

		if (Array.isArray(fields) && fields.length) {
			let and = [];

			for (field of fields) {
				// for custom filteration fields like date range, etc.
				if (typeof fields[field] == "object") {
					and.push(fields[field]);
					continue;
				}

				let path = this.schema.paths[field];

				if (path && typeof query[field] != "undefined" && query[field] != null) {
					let { instance } = path;

					if (instance == "String") {
						and.push({ [field]: { $regex: query[field], $options: "i" } });
					} else if (instance == "Array") {
						and.push({ [field]: { $in: query[field] } });
					} else {
						and.push({ [field]: { $eq: query[field] } });
					}
				}
			}

			if (and.length) return this.where({ $and: and });
		}

		return this;
	};
};