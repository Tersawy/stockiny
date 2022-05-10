const mongoose = require("mongoose");

const { checkSchema } = require("express-validator");

const { existsSync } = require("fs");

const Product = require("./Product");

const Brand = require("../brand/Brand");

const Category = require("../category/Category");

const Unit = require("../unit/Unit");

let variantSchema = require("./schemas/VariantSchema");

variantSchema = variantSchema.obj;

let schema = Product.schema.obj;

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

	category: {
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
				if (!value) throw { type: "mongoId", value: "Category" };

				let category = await Category.findById(value);

				if (!category) throw { type: "notFound", value: "Category" };
			},
		},
	},

	brand: {
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
				if (!value) throw { type: "mongoId", value: "Brand" };

				let brand = await Brand.findById(value);

				if (!brand) throw { type: "notFound", value: "Brand" };
			},
		},
	},

	barcodeType: {
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

		toLowerCase: schema.barcodeType.lowercase,

		trim: schema.barcodeType.trim,

		isLength: {
			options: { min: schema.barcodeType.minlength, max: schema.barcodeType.maxlength },
			errorMessage: { type: "between", min: schema.barcodeType.minlength, max: schema.barcodeType.maxlength },
		},
	},

	code: {
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

		toLowerCase: schema.code.lowercase,

		trim: schema.code.trim,

		isLength: {
			options: { min: schema.code.minlength, max: schema.code.maxlength },
			errorMessage: { type: "between", min: schema.code.minlength, max: schema.code.maxlength },
		},
	},

	price: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isFloat: {
			errorMessage: { type: "minValue", min: schema.price.min },
			options: { min: schema.price.min },
		},
	},

	cost: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isFloat: {
			errorMessage: { type: "minValue", min: schema.cost.min },
			options: { min: schema.cost.min },
		},
	},

	minimumStock: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isFloat: {
			errorMessage: { type: "minValue", min: schema.minimumStock.min },
			options: { min: schema.minimumStock.min },
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

	taxMethod: {
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

		toLowerCase: schema.taxMethod.lowercase,

		trim: schema.taxMethod.trim,

		custom: {
			options: (value) => ["inclusive", "exclusive"].includes(value),
			errorMessage: { type: "enum", values: ["inclusive", "exclusive"] }, // "taxMethod must be either 'inclusive' or 'exclusive'"
		},
	},

	unit: {
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
				if (!value) throw { type: "mongoId", value: "Unit" };

				let units = await Unit.find({ $or: [{ _id: value }, { base: value }] }); // get main unit with subunits

				if (!units || !units.length) throw { type: "notFound", value: "Unit" };

				let baseUnit = units.find((unit) => unit._id == value);

				if (!baseUnit || baseUnit.base) throw { type: "notFound", value: "Unit" };

				req.body.subunits = units; // to check purchase and sale unit
			},
		},
	},

	purchaseUnit: {
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
			options: (value, { req }) => {
				if (!value) throw { type: "mongoId", value: "Purchase Unit" };

				let purchaseUnit = req.body.subunits.find((unit) => unit._id == value);

				if (purchaseUnit) return true;

				throw { type: "notFound", value: "Purchase Unit" };
			},
		},
	},

	saleUnit: {
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
			options: (value, { req }) => {
				if (!value) throw { type: "mongoId", value: "Sale Unit" };

				let saleUnit = req.body.subunits.find((unit) => unit._id == value);

				if (saleUnit) return true;

				throw { type: "notFound", value: "Sale Unit" };
			},
		},
	},

	variants: {
		in: "body",

		customSanitizer: {
			options: (value) => {
				value = Array.isArray(value) ? value : [];

				value = value.reduce((variants, variant) => {
					if (variant.length <= variantSchema.name.maxlength && variant.length >= variantSchema.name.minlength) {
						if (variantSchema.name.trim) {
							variant = variant.trim();
						}

						if (variantSchema.name.lowercase) {
							variant = variant.toLowerCase();
						}

						variants.push(variant);

						return variants;
					}

					return variants;
				}, []);

				return value;
			},
		},
	},

	availableForSale: {
		in: "body",

		customSanitizer: {
			options: (value) => {
				return value == "true" || value == true;
			},
		},
	},

	availableForPurchase: {
		in: "body",

		customSanitizer: {
			options: (value) => {
				return value == "true" || value == true;
			},
		},
	},

	availableForSaleReturn: {
		in: "body",

		customSanitizer: {
			options: (value) => {
				return value == "true" || value == true;
			},
		},
	},

	availableForPurchaseReturn: {
		in: "body",

		customSanitizer: {
			options: (value) => {
				return value == "true" || value == true;
			},
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

		isLength: {
			options: { max: schema.notes.maxlength },
			errorMessage: { type: "maxLength", max: schema.notes.maxlength },
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

let update = { ...create };

delete update.variants;

update.id = checkId;

exports.create = checkSchema(create);

exports.update = checkSchema(update);

exports.product = checkSchema({ id: checkId });

exports.getEdit = checkSchema({ id: checkId });

exports.delete = checkSchema({ id: checkId });

let controls = (controlName) => ({
	id: checkId,

	[controlName]: {
		in: "body",

		customSanitizer: { options: (v) => v == "true" || v == true },
	},
});

exports.changeSaleAvailability = checkSchema(controls("availableForSale"));

exports.changePurchaseAvailability = checkSchema(controls("availableForPurchase"));

exports.changeSaleReturnAvailability = checkSchema(controls("availableForSaleReturn"));

exports.changePurchaseReturnAvailability = checkSchema(controls("availableForPurchaseReturn"));

exports.changeVariantSaleAvailability = checkSchema({ ...controls("availableForSale"), variantId: checkId });

exports.changeVariantPurchaseAvailability = checkSchema({ ...controls("availableForPurchase"), variantId: checkId });

exports.changeVariantSaleReturnAvailability = checkSchema({ ...controls("availableForSaleReturn"), variantId: checkId });

exports.changeVariantPurchaseReturnAvailability = checkSchema({ ...controls("availableForPurchaseReturn"), variantId: checkId });

exports.addVariant = checkSchema({
	id: checkId,

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

		toLowerCase: variantSchema.name.lowercase,

		trim: variantSchema.name.trim,

		isLength: {
			options: { min: variantSchema.name.minlength, max: variantSchema.name.maxlength },
			errorMessage: { type: "between", min: variantSchema.name.minlength, max: variantSchema.name.maxlength },
		},
	},
});

exports.getVariantStocks = checkSchema({ id: checkId, variantId: checkId });

exports.updateVariant = checkSchema({
	id: checkId,

	variantId: checkId,

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

		toLowerCase: variantSchema.name.lowercase,

		trim: variantSchema.name.trim,

		isLength: {
			options: { min: variantSchema.name.minlength, max: variantSchema.name.maxlength },
			errorMessage: { type: "between", min: variantSchema.name.minlength, max: variantSchema.name.maxlength },
		},
	},
});

exports.changeImage = checkSchema({
	id: checkId,

	image: {
		in: "body",

		trim: true,

		customSanitizer: {
			options: (v, { req }) => {
				let isString = !!v && typeof v === "string";

				if (!isString) return "";

				let imageNamePattern = /^[0-9]+_[a-z0-9]+.(jpg|png|jpeg)$/gi;

				let isValid = imageNamePattern.test(v);

				if (!isValid) throw { type: "invalid" };

				let { getImagesPath } = req.app.locals.config;

				let productPath = getImagesPath("products", req.params.id);

				let imagePath = `${productPath}/${v}`;

				if (!existsSync(imagePath)) throw { type: "notFound" };

				return v;
			},
		},
	},
});

exports.changeVariantImages = checkSchema({
	id: checkId,

	variantId: checkId,

	images: {
		in: "body",

		customSanitizer: {
			options: (v, { req }) => {
				let { getImagesPath } = req.app.locals.config;

				let productPath = getImagesPath("products", req.params.id);

				v = Array.isArray(v) ? v : [v];

				v = v.reduce((images, image) => {
					let isString = !!image && typeof image === "string";

					if (!isString) return images;

					let imageNamePattern = /^[0-9]+_[a-z0-9]+.(jpg|png|jpeg)$/gi;

					let isValid = imageNamePattern.test(image);

					if (!isValid) return images;

					let imagePath = `${productPath}/${image}`;

					if (!existsSync(imagePath)) return images;

					images.push(image);

					return images;
				}, []);

				return v;
			},
		},
	},
});

exports.changeVariantDefaultImage = checkSchema({
	id: checkId,

	variantId: checkId,

	image: {
		in: "body",

		trim: true,

		customSanitizer: {
			options: (v, { req }) => {
				let isString = !!v && typeof v === "string";

				if (!isString) return "";

				let imageNamePattern = /^[0-9]+_[a-z0-9]+.(jpg|png|jpeg)$/gi;

				let isValid = imageNamePattern.test(v);

				if (!isValid) throw { type: "invalid" };

				let { getImagesPath } = req.app.locals.config;

				let productPath = getImagesPath("products", req.params.id);

				let imagePath = `${productPath}/${v}`;

				if (!existsSync(imagePath)) throw { type: "notFound" };

				return v;
			},
		},
	},
});
