const { checkSchema } = require("express-validator");

const statusSchema = require("./schemas/StatusSchema").obj;

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

		toLowerCase: statusSchema.name.lowercase,

		trim: statusSchema.name.trim,

		isLength: {
			options: { min: statusSchema.name.minlength, max: statusSchema.name.maxlength },
			errorMessage: { type: "between", min: statusSchema.name.minlength, max: statusSchema.name.maxlength },
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

		toLowerCase: statusSchema.color.lowercase,

		trim: statusSchema.color.trim,

		isLength: {
			options: { max: statusSchema.color.maxlength },
			errorMessage: { type: "max", max: statusSchema.color.maxlength },
		},
	},

	description: {
		in: "body",

		optional: true,

		isString: {
			errorMessage: { type: "string" },
		},

		toLowerCase: statusSchema.description.lowercase,

		trim: statusSchema.description.trim,

		isLength: {
			options: { max: statusSchema.description.maxlength },
			errorMessage: { type: "maxLength", max: statusSchema.description.maxlength },
		},
	},
};

let update = { ...create, id: checkId };

exports.createStatus = checkSchema(create);

exports.updateStatus = checkSchema(update);

exports.deleteStatus = checkSchema({ id: checkId });

exports.changeEffectedStatus = checkSchema({ id: checkId });
