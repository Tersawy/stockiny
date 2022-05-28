const mongoose = require("mongoose");

const schema = require("./schemas/TransferSchema").obj;

const detailSchema = require("./schemas/DetailSchema").obj;

const { checkSchema } = require("express-validator");

let createTransfer = {
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

	fromWarehouse: {
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

	toWarehouse: {
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

	details: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},
	},

	"details.*.amount": {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isFloat: {
			errorMessage: { type: "minValue", gt: 0 },
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
			errorMessage: { type: "minValue", gt: 0 },
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

let updateTransfer = { ...createTransfer, id: checkId };

exports.getTransfers = checkSchema({
	date: { in: "query", toDate: true },

	fromWarehouse: { in: "query", customSanitizer: { options: (v) => mongoose.Types.ObjectId.isValid(v) ? v : null } },

	toWarehouse: { in: "query", customSanitizer: { options: (v) => mongoose.Types.ObjectId.isValid(v) ? v : null } },

	status: { in: "query", customSanitizer: { options: (v) => mongoose.Types.ObjectId.isValid(v) ? v : null } },
});

exports.createTransfer = checkSchema(createTransfer);

exports.getTransfer = checkSchema({ id: checkId });

exports.getEditTransfer = checkSchema({ id: checkId });

exports.deleteTransfer = checkSchema({ id: checkId });

exports.updateTransfer = checkSchema(updateTransfer);

exports.changeTransferStatus = checkSchema({
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
