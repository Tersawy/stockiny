const { checkSchema } = require("express-validator");

const Status = require("./Status");

let schema = Status.schema.obj;

let checkId = {
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
};

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

	color: {
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

		toLowerCase: schema.color.lowercase,

		trim: schema.color.trim,

		isLength: {
			options: { max: schema.color.maxlength },
			errorMessage: { type: "max", max: schema.color.maxlength },
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
			errorMessage: { type: "maxLength", max: schema.description.maxlength },
		},
	},
};

let update = { ...create, id: checkId };

exports.createStatus = checkSchema(create);

exports.updateStatus = checkSchema(update);

exports.deleteStatus = checkSchema({ id: checkId });

exports.changeEffectedStatus = checkSchema({ id: checkId });
