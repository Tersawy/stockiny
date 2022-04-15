const { checkSchema } = require("express-validator");

const Customer = require("./Customer");

let schema = Customer.schema.obj;

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
