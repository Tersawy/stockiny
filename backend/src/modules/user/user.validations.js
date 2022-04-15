const mongoose = require("mongoose");

const { checkSchema } = require("express-validator");

const Permission = require("../permission/Permission");

const Role = require("../role/Role");

const User = require("./User");

let schema = User.schema.obj;

let create = {
	username: {
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

		toLowerCase: schema.username.lowercase,

		trim: schema.username.trim,

		isLength: {
			options: { min: schema.username.minlength, max: schema.username.maxlength },
			errorMessage: { type: "between", min: schema.username.minlength, max: schema.username.maxlength },
		},
	},

	fullname: {
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

		toLowerCase: schema.fullname.lowercase,

		trim: schema.fullname.trim,

		isLength: {
			options: { min: schema.fullname.minlength, max: schema.fullname.maxlength },
			errorMessage: { type: "between", min: schema.fullname.minlength, max: schema.fullname.maxlength },
		},
	},

	phone: {
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

		toLowerCase: schema.phone.lowercase,

		trim: schema.phone.trim,

		isLength: {
			options: { min: schema.phone.minlength, max: schema.phone.maxlength },
			errorMessage: { type: "between", min: schema.phone.minlength, max: schema.phone.maxlength },
		},
	},

	email: {
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

		isEmail: {
			errorMessage: { type: "email" },
		},

		toLowerCase: schema.email.lowercase,

		trim: schema.email.trim,

		isLength: {
			options: { min: schema.email.minlength, max: schema.email.maxlength },
			errorMessage: { type: "between", min: schema.email.minlength, max: schema.email.maxlength },
		},
	},

	password: {
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

		isLength: {
			options: { min: 8, max: 20 },
			errorMessage: { type: "between", min: 8, max: 20 },
		},
	},

	country: {
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

		toLowerCase: schema.country.lowercase,

		trim: schema.country.trim,

		isLength: {
			options: { min: schema.country.minlength, max: schema.country.maxlength },
			errorMessage: { type: "between", min: schema.country.minlength, max: schema.country.maxlength },
		},
	},

	city: {
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

		toLowerCase: schema.city.lowercase,

		trim: schema.city.trim,

		isLength: {
			options: { min: schema.city.minlength, max: schema.city.maxlength },
			errorMessage: { type: "between", min: schema.city.minlength, max: schema.city.maxlength },
		},
	},

	address: {
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

		toLowerCase: schema.address.lowercase,

		trim: schema.address.trim,

		isLength: {
			options: { min: schema.address.minlength, max: schema.address.maxlength },
			errorMessage: { type: "between", min: schema.address.minlength, max: schema.address.maxlength },
		},
	},

	zipCode: {
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

		toLowerCase: schema.zipCode.lowercase,

		trim: schema.zipCode.trim,

		isLength: {
			options: { min: schema.zipCode.minlength, max: schema.zipCode.maxlength },
			errorMessage: { type: "between", min: schema.zipCode.minlength, max: schema.zipCode.maxlength },
		},
	},

	role: {
		in: "body",

		customSanitizer: {
			options: (v) => {
				return mongoose.Types.ObjectId.isValid(v) ? v : null;
			},
		},

		custom: {
			if: (v) => mongoose.Types.ObjectId.isValid(v),

			options: async (value, { req }) => {
				let role = await Role.findById(value);

				if (!role) throw { type: "notFound", value: "role" };

				req.roleDoc = role;

				return true;
			},
		},
	},

	permissions: {
		in: "body",

		custom: {
			options: (value) => {
				if (Array.isArray(value) && value.length > 0) {
					return value.every((v) => typeof v === "string");
				}

				return true;
			},
			errorMessage: { type: "invalid" },
		},

		customSanitizer: {
			options: async (value, { req }) => {
				let permissions = [];

				if (typeof value === "string") {
					permissions = [value];
				} else if (Array.isArray(value)) {
					permissions = value;
				}

				if (permissions.length > 0) {
					if (req.roleDoc && req.roleDoc.permissions.length > 0) {
						permissions = permissions.filter((v) => !req.roleDoc.permissions.includes(v));
					}

					if (permissions.length > 0) {
						permissions = await Permission.find({ _id: { $in: permissions } }, { _id: 1 });

						permissions = permissions.map((v) => v._id);
					}
				}
				return permissions;
			},
		},
	},

	isActive: {
		in: "body",

		customSanitizer: {
			options: (value, { req }) => {
				let isMeHaveActiveUser = req.me.isOwner || req.me.permissions.includes("active:users");

				if (isMeHaveActiveUser) {
					return value == "true" || value == true;
				}

				return false;
			},
		},
	},
};

exports.create = checkSchema(create);

exports.update = checkSchema({
	...create,

	password: {
		in: "body",

		isLength: {
			if: (value) => {
				return value !== undefined && value !== null && value !== "" && value.length > 0;
			},
			options: { min: 8, max: 54 },
			errorMessage: { type: "between", min: 8, max: 54 },
		},

		customSanitizer: {
			options: (v) => {
				return v || null;
			},
		},
	},

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

exports.getUser = checkSchema({
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

exports.changeActivation = checkSchema({
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
