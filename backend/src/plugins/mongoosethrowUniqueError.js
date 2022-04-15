const { createError } = require("../errors/ErrorHandler");

module.exports = (schema) => {
	schema.methods.throwUniqueError = function (obj = {}) {
		for (let field in obj) {
			if (this[field] == obj[field]) {
				throw createError({ field, message: { type: "unique", value: obj[field] } }, 422);
			}
		}
	};
};
