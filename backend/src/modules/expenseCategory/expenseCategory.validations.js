const { checkSchema } = require("express-validator");

const ExpenseCategory = require("./ExpenseCategory");

let schema = ExpenseCategory.schema.obj;

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

	description: {
		in: "body",

		optional: true,

		isString: {
			errorMessage: { type: "string" },
		},

		toLowerCase: schema.description.lowercase,

		trim: schema.description.trim,

		isLength: {
			options: { max: schema.description.maxlength },
			errorMessage: { type: "max", max: schema.description.maxlength }, //`description must be less than ${schema.description.maxlength} characters long`
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
