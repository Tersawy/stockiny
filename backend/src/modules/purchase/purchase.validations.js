const mongoose = require("mongoose");

const Supplier = require("../supplier/Supplier");

const Warehouse = require("../warehouse/Warehouse");

const Status = require("../status/Status");

const schema = require("./schemas/PurchaseSchema").obj;

const detailSchema = require("./schemas/DetailSchema").obj;

const paymentSchema = require("./schemas/PaymentSchema").obj;

const { checkSchema } = require("express-validator");

let isFloat = (num) => /^\d+$|^\d+\.\d+$|^\.\d+$/.test(num) && num > 0; // eg. 1, 1.1, 0.1

let createPurchase = {
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
		},

		customSanitizer: {
			options: (v) => {
				return mongoose.Types.ObjectId.isValid(v) ? v : null;
			},
		},

		custom: {
			options: async (value) => {
				if (!value) throw { type: "mongoId", value: "Warehouse" };

				let warehouse = await Warehouse.findById(value, "_id");

				if (!warehouse) throw { type: "notFound", value: "Warehouse" };

				return true;
			},
		},
	},

	supplier: {
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

		customSanitizer: {
			options: (v) => {
				return mongoose.Types.ObjectId.isValid(v) ? v : null;
			},
		},

		custom: {
			options: async (value) => {
				if (!value) throw { type: "mongoId", value: "Supplier" };

				let supplier = await Supplier.findById(value, "_id");

				if (!supplier) throw { type: "notFound", value: "Supplier" };

				return true;
			},
		},
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

		// custom: {
		// 	options: (details) => {
		// 		if (!Array.isArray(details)) throw { type: "array", value: "details" };

		// 		if (!details.length) throw { type: "required", value: "Details" };

		// 		for (let d of details) {
		// 			if (!isFloat(d.amount)) throw { type: "required", value: "Price" };

		// 			if (!isFloat(d.quantity)) throw { type: "required", value: "Quantity" };

		// 			if (!isFloat(d.tax)) throw { type: "required", value: "Tax" };

		// 			if (!["inclusive", "exclusive"].includes(d.taxMethod)) throw { type: "enum", value: "TaxMethod" };

		// 			if (!["percent", "fixed"].includes(d.discountMethod)) throw { type: "enum", value: "DiscountMethod" };

		// 			if (!isFloat(d.discount)) throw { type: "required", value: "Discount" };

		// 			if (d.discountMethod == "percent" && +d.discount > 100) {
		// 				throw { type: "maxValue", value: "Discount", max: 100 };
		// 			}

		// 			if (!d.product) throw { type: "required", value: "Product" };

		// 			if (!mongoose.Types.ObjectId.isValid(d.product)) throw { type: "mongoId", value: "Product" };

		// 			if (!d.variant) throw { type: "required", value: "Variant" };

		// 			if (!mongoose.Types.ObjectId.isValid(d.variant)) throw { type: "mongoId", value: "Variant" };

		// 			if (!d.unit) throw { type: "required", value: "Unit" };

		// 			if (!mongoose.Types.ObjectId.isValid(d.unit)) throw { type: "mongoId", value: "Unit" };

		// 			if (!d.subUnit) throw { type: "required", value: "PurchaseUnit" };

		// 			if (!mongoose.Types.ObjectId.isValid(d.subUnit)) throw { type: "mongoId", value: "PurchaseUnit" };
		// 		}
		// 	},
		// },
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
		},

		customSanitizer: {
			options: (v) => {
				return mongoose.Types.ObjectId.isValid(v) ? v : null;
			},
		},

		custom: {
			options: async (value, { req }) => {
				if (!value) throw { type: "mongoId", value: "Status" };

				let status = await Status.findOne({ invoice: "purchases", _id: value });

				if (!status) throw { type: "notFound", value: "Status" };

				req.body.status = status;

				return true;
			}
		},
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

let updatePurchase = { ...createPurchase, id: checkId };

exports.getPurchases = checkSchema({
	date: { in: "query", toDate: true },

	warehouse: { in: "query", customSanitizer: { options: (v) => mongoose.Types.ObjectId.isValid(v) ? v : null } },

	supplier: { in: "query", customSanitizer: { options: (v) => mongoose.Types.ObjectId.isValid(v) ? v : null } },

	status: { in: "query", customSanitizer: { options: (v) => mongoose.Types.ObjectId.isValid(v) ? v : null } },

	paymentStatus: { in: "query", customSanitizer: { options: (v) => ["paid", "partial", "unpaid"].includes(v) ? v : null } },
});

exports.createPurchase = checkSchema(createPurchase);

exports.getPurchase = checkSchema({ id: checkId });

exports.getEditPurchase = checkSchema({ id: checkId });

exports.deletePurchase = checkSchema({ id: checkId });

exports.updatePurchase = checkSchema(updatePurchase);

exports.changePurchaseStatus = checkSchema({
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
		},

		customSanitizer: {
			options: (v) => {
				return mongoose.Types.ObjectId.isValid(v) ? v : null;
			}
		},

		custom: {
			options: async (value, { req }) => {
				if (!value) throw { type: "mongoId", value: "Status" };

				let status = await Status.findOne({ invoice: "purchases", _id: value });

				if (!status) throw { type: "notFound", value: "Status" };

				req.body.status = status;

				return true;
			}
		},
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
