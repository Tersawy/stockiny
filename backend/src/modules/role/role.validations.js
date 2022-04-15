const { checkSchema } = require("express-validator");

const Role = require("./Role");

const Permission = require("../permission/Permission");

let schema = Role.schema.obj;

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

	permissions: {
		in: "body",

		custom: {
			options: (value) => {
				if (!Array.isArray(value) || !value.length) throw { type: "required" };

				return value.every((v) => typeof v === "string");
			},
			errorMessage: { type: "invalid" },
		},

		customSanitizer: {
			options: async (value) => {
				let permissions = await Permission.find({ _id: { $in: value } });

				return permissions.map((p) => p._id);
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
