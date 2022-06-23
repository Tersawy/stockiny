const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ObjectId = Schema.Types.ObjectId;

const stockSchema = require("./StockSchema");

const imageSchema = require("./ImageSchema");

const variantSchema = new Schema(
	{
		name: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 54 },

		stocks: [stockSchema],

		images: [imageSchema],

		availableForSale: { type: Boolean, default: false },

		availableForPurchase: { type: Boolean, default: false },

		availableForSaleReturn: { type: Boolean, default: false },

		availableForPurchaseReturn: { type: Boolean, default: false },

		deletedAt: { type: Date, default: null },

		deletedBy: { type: ObjectId, ref: "User", default: null },

		createdBy: { type: ObjectId, ref: "User", required: true },

		updatedBy: { type: ObjectId, ref: "User", default: null },
	},
	{ timestamps: true }
);

module.exports = variantSchema;
