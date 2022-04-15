const { checkSchema } = require("express-validator");

const Currency = require("./Currency");

let schema = Currency.schema.obj;

let create = {
	name: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isString: {
			errorMessage: { type: "string" },
		},

		toLowerCase: schema.name.lowercase,

		trim: schema.name.trim,

		isLength: {
			options: { min: schema.name.minlength, max: schema.name.maxlength },
			errorMessage: { type: "between", min: schema.name.minlength, max: schema.name.maxlength },
		},
	},

	code: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isString: {
			errorMessage: { type: "string" },
		},

		toLowerCase: schema.code.lowercase,

		trim: schema.code.trim,

		isLength: {
			options: { min: schema.code.minlength, max: schema.code.maxlength },
			errorMessage: { type: "between", min: schema.code.minlength, max: schema.code.maxlength },
		},
	},

	symbol: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isString: {
			errorMessage: { type: "string" },
		},

		toLowerCase: schema.symbol.lowercase,

		trim: schema.symbol.trim,

		isLength: {
			options: { min: schema.symbol.minlength, max: schema.symbol.maxlength },
			errorMessage: { type: "between", min: schema.symbol.minlength, max: schema.symbol.maxlength },
		},
	},
};

exports.create = checkSchema(create);

exports.update = checkSchema({
	...create,

	id: {
		in: "params",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isMongoId: {
			errorMessage: { type: "mongoId" },
		},
	},
});

exports.delete = checkSchema({
	id: {
		in: "params",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isMongoId: {
			errorMessage: { type: "mongoId" },
		},
	},
});
