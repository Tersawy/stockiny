const { checkSchema } = require("express-validator");

const User = require("../user/User");

let schema = User.schema.obj;

exports.updateProfile = checkSchema({
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
			options: { min: 8, max: 54 },
			errorMessage: { type: "incorrect" },
		},

		custom: {
			options: async (value, { req }) => {
				let isPasswordMatch = await req.me.isPasswordMatch(value);

				if (isPasswordMatch) return true;

				throw { type: "incorrect" };
			},
		},
	},

	newPassword: {
		in: "body",

		isLength: {
			if: (value) => value !== undefined && value !== null && value !== "" && value.length > 0,
			options: { min: 8, max: 54 },
			errorMessage: { type: "between", min: 8, max: 54 },
		},

		customSanitizer: {
			options: (v, { req }) => {
				if (v) {
					req.body.password = v;
				}

				return null;
			},
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
