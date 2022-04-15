const mongoose = require("mongoose");

const { checkSchema } = require("express-validator");

const Unit = require("./Unit");

let schema = Unit.schema.obj;

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

	shortName: {
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

		toLowerCase: schema.shortName.lowercase,

		trim: schema.shortName.trim,

		isLength: {
			options: { min: schema.shortName.minlength, max: schema.shortName.maxlength },
			errorMessage: { type: "between", min: schema.shortName.minlength, max: schema.shortName.maxlength },
		},
	},

	value: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isFloat: {
			errorMessage: { type: "minValue", min: schema.value.min }, // `value must be at least ${schema.value.min} digits long`
			options: { min: schema.value.min },
		},
	},

	operator: {
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

		toLowerCase: schema.operator.lowercase,

		trim: schema.operator.trim,

		custom: {
			options: (value) => ["*", "/"].includes(value),
			errorMessage: { type: "enum", values: ["*", "/"] }, // "operator must be either '*' or '/'"
		},
	},

	base: {
		in: "body",

		customSanitizer: {
			options: (v) => {
				return mongoose.Types.ObjectId.isValid(v) ? v : null;
			},
		},

		custom: {
			options: async (value) => {
				if (value && value.length) {
					let unit = await Unit.findOne({ _id: value, base: null });

					if (!unit) {
						throw { type: "notFound", value: "Main Unit" };
					}
				}

				return true;
			},
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
