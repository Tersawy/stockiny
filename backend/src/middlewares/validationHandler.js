const { validationResult } = require("express-validator");

const { createError } = require("../errors/ErrorHandler");

module.exports = (req, res, next) => {
	let result = validationResult(req);

	if (!result.isEmpty()) {
		let firstError = result.errors[0];

		return next(createError({ field: firstError.param, message: firstError.msg }, 422));
	}

	next();
};
