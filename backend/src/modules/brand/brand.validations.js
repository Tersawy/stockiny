const { checkSchema } = require("express-validator");

const Brand = require("./Brand");

let schema = Brand.schema.obj;

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
			// if: (value) => {
			// 	return value !== undefined && value !== null && value !== "";
			// },
			options: { max: schema.description.maxlength },
			errorMessage: { type: "maxLength", max: schema.description.maxlength },
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

	image: {
		in: "body",

		customSanitizer: {
			options: (v) => {
				v = (v || "").toString();

				if (/^[a-z]+_[0-9]+.(jpg|png|jpeg)$/gi.test(v)) return v;

				return "";
			},
		},

		trim: true,
	},
});

exports.changeImage = checkSchema({
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

	image: {
		in: "body",

		customSanitizer: {
			options: (v) => {
				v = (v || "").toString();

				if (/^[a-z]+_[0-9]+.(jpg|png|jpeg)$/gi.test(v)) return v;

				return "";
			},
		},

		trim: true,
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
