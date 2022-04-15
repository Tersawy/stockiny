module.exports = (schema) => {
	schema.query.withPagination = function (options = {}) {
		let defaultOptions = { perPage: 10, page: 1, sortBy: "createdAt", sortDir: "desc" };

		options = { ...defaultOptions, ...options };

		let { perPage, page, sortBy, sortDir } = options;

		sortDir = ["asc", "desc"].includes(sortDir) ? sortDir : "desc";

		sortBy = Object.keys(this.schema.paths).includes(sortBy) ? sortBy : "createdAt";

		page = +(/^\d+$/.test(page) && page) || 1;

		perPage = +(/^\d+$/.test(perPage) && perPage) || 10;

		const sort = { [sortBy]: sortDir };

		const skip = (page - 1) * perPage;

		const limit = perPage;

		return this.sort(sort).skip(skip).limit(limit);
	};
};
