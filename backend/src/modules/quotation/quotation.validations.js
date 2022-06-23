const mongoose = require("mongoose");

const schema = require("./schemas/QuotationSchema").obj;

const detailSchema = require("./schemas/DetailSchema").obj;

const paymentSchema = require("./schemas/PaymentSchema").obj;

const { checkSchema } = require("express-validator");

let isFloat = (num) => /^\d+$|^\d+\.\d+$|^\.\d+$/.test(num) && num > 0; // eg. 1, 1.1, 0.1

let createQuotation = {
	date: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isDate: {
			errorMessage: { type: "invalid" },
		},
	},

	warehouse: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isMongoId: {
			errorMessage: { type: "mongoId" },
		}
	},

	customer: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isMongoId: {
			errorMessage: { type: "mongoId" },
		}
	},

	tax: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isFloat: {
			errorMessage: { type: "between", min: schema.tax.min, max: schema.tax.max },
			options: { min: schema.tax.min, max: schema.tax.max },
		},
	},

	discountMethod: {
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

		toLowerCase: schema.discountMethod.lowercase,

		trim: schema.discountMethod.trim,

		custom: {
			options: (value) => ["percent", "fixed"].includes(value),
			errorMessage: { type: "enum", values: ["percent", "fixed"] },
		},
	},

	discount: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isFloat: {
			errorMessage: { type: "minValue", min: schema.discount.min },
			options: { min: schema.discount.min },
		},

		custom: {
			options: (value, { req }) => {
				if (req.body.discountMethod == "percent") {
					return value <= 100;
				}

				return true;
			},
			errorMessage: { type: "maxValue", max: 100 },
		},
	},

	shipping: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isFloat: {
			errorMessage: { type: "between", min: schema.shipping.min },
			options: { min: schema.shipping.min },
		},
	},

	details: { in: "body", exists: { errorMessage: { type: "required" } } },

	"details.*.amount": {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isFloat: {
			errorMessage: { type: "mustGtValue", value: 0 },
			options: { gt: 0 },
		},
	},

	"details.*.quantity": {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isFloat: {
			errorMessage: { type: "mustGtValue", value: 0 },
			options: { gt: 0 },
		},
	},

	"details.*.taxMethod": {
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

		toLowerCase: detailSchema.taxMethod.lowercase,

		trim: detailSchema.taxMethod.trim,

		custom: {
			options: (value) => ["inclusive", "exclusive"].includes(value),
			errorMessage: { type: "enum", values: ["inclusive", "exclusive"] },
		},
	},

	"details.*.tax": {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isFloat: {
			errorMessage: { type: "minValue", min: detailSchema.tax.min, max: detailSchema.tax.max },
			options: { min: detailSchema.tax.min, max: detailSchema.tax.max },
		},
	},

	"details.*.discountMethod": {
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

		toLowerCase: detailSchema.discountMethod.lowercase,

		trim: detailSchema.discountMethod.trim,

		custom: {
			options: (value) => ["percent", "fixed"].includes(value),
			errorMessage: { type: "enum", values: ["percent", "fixed"] },
		},
	},

	"details.*.discount": {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isFloat: {
			errorMessage: { type: "minValue", min: detailSchema.discount.min },
			options: { min: detailSchema.discount.min },
		},

		custom: {
			options: (value, { req }) => {
				if (req.body.discountMethod === "percent") {
					return value <= 100;
				}

				return true;
			},
			errorMessage: { type: "maxValue", max: 100 },
		},
	},

	"details.*.variant": {
		in: "body",

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

	"details.*.product": {
		in: "body",

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

	"details.*.subUnit": {
		in: "body",

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

	status: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isMongoId: {
			errorMessage: { type: "mongoId" },
		}
	},

	notes: {
		in: "body",

		optional: true,

		isString: {
			errorMessage: { type: "string" },
		},

		toLowerCase: schema.notes.lowercase,

		trim: schema.notes.trim,

		optional: { options: { nullable: true } },

		isLength: {
			options: { max: schema.notes.maxlength },
			errorMessage: { type: "max", max: schema.notes.maxlength },
		},
	},
};

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

let updateQuotation = { ...createQuotation, id: checkId };

exports.getQuotations = checkSchema({
	date: { in: "query", toDate: true },

	warehouse: { in: "query", customSanitizer: { options: (v) => mongoose.Types.ObjectId.isValid(v) ? v : null } },

	customer: { in: "query", customSanitizer: { options: (v) => mongoose.Types.ObjectId.isValid(v) ? v : null } },

	status: { in: "query", customSanitizer: { options: (v) => mongoose.Types.ObjectId.isValid(v) ? v : null } },

	paymentStatus: { in: "query", customSanitizer: { options: (v) => ["paid", "partial", "unpaid"].includes(v) ? v : null } },
});

exports.createQuotation = checkSchema(createQuotation);

exports.getQuotation = checkSchema({ id: checkId });

exports.getEditQuotation = checkSchema({ id: checkId });

exports.deleteQuotation = checkSchema({ id: checkId });

exports.updateQuotation = checkSchema(updateQuotation);

exports.changeQuotationStatus = checkSchema({
	id: checkId,

	statusId: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isMongoId: {
			errorMessage: { type: "mongoId" },
		}
	}
});

exports.getPayments = checkSchema({ id: checkId });

const createPayment = {
	id: checkId,

	date: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isDate: {
			errorMessage: { type: "date" },
		},
	},

	amount: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isFloat: {
			errorMessage: { type: "float" },
		},

		custom: {
			options: async (value) => {
				if (value <= 0) throw { type: "invalid", value: "Amount" };

				return isFloat(value);
			}
		},
	},

	paymentType: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		toLowerCase: paymentSchema.paymentType.lowercase,

		trim: paymentSchema.paymentType.trim,

		custom: {
			options: (value) => {
				if (!value || !paymentSchema.paymentType.enum.includes(value)) throw { type: "invalid", value: "Payment Type" };

				return true;
			}
		},
	},

	notes: {
		in: "body",

		isString: {
			errorMessage: { type: "string" },
		},

		toLowerCase: paymentSchema.notes.lowercase,

		trim: paymentSchema.notes.trim,

		optional: { options: { nullable: true } },

		isLength: {
			options: { max: paymentSchema.notes.maxlength },
			errorMessage: { type: "max", max: paymentSchema.notes.maxlength },
		},
	},
};

exports.createPayment = checkSchema(createPayment);

exports.updatePayment = checkSchema({ ...createPayment, paymentId: checkId });

exports.deletePayment = checkSchema({ paymentId: checkId, id: checkId });
