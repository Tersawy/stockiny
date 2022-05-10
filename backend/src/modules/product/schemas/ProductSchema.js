const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ObjectId = Schema.Types.ObjectId;

const variantSchema = require("./VariantSchema");

const productSchema = new Schema(
	{
		name: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 54 }, // Unique

		barcodeType: { type: String, required: true, trim: true, minlength: 3, maxlength: 20 },

		code: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 20 }, // Unique

		price: { type: Number, required: true, min: 1 },

		cost: { type: Number, required: true, min: 1 },

		minimumStock: { type: Number, required: true, min: 0 },

		tax: { type: Number, required: true, min: 0, max: 100 },

		taxMethod: { type: String, required: true, enum: ["inclusive", "exclusive"] },

		category: { type: ObjectId, ref: "Category", required: true },

		brand: { type: ObjectId, ref: "Brand", required: true },

		unit: { type: ObjectId, ref: "Unit", required: true },

		purchaseUnit: { type: ObjectId, ref: "Unit", required: true },

		saleUnit: { type: ObjectId, ref: "Unit", required: true },

		variants: [variantSchema],

		image: { type: String, default: "" },

		availableForSale: { type: Boolean, default: false },

		availableForPurchase: { type: Boolean, default: false },

		availableForSaleReturn: { type: Boolean, default: false },

		availableForPurchaseReturn: { type: Boolean, default: false },

		// stock: [stockSchema],

		// images: [imageSchema],

		notes: { type: String, trim: true, maxlength: 254, default: "" },

		deletedAt: { type: Date, default: null },

		deletedBy: { type: ObjectId, ref: "User", default: null },

		createdBy: { type: ObjectId, ref: "User", required: true },

		updatedBy: { type: ObjectId, ref: "User", default: null },
	},
	{ timestamps: true }
);

module.exports = productSchema;
