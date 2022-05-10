const mongoose = require("mongoose");

const detailSchema = require("./DetailSchema");

const paymentSchema = require("./PaymentSchema");

const Schema = mongoose.Schema;

const saleSchema = new Schema(
	{
		date: { type: Date, default: Date.now },

		customer: { type: Schema.Types.ObjectId, ref: "Customer" },

		warehouse: { type: Schema.Types.ObjectId, ref: "Warehouse" },

		tax: { type: Number, default: 0, min: 0, max: 100 },

		discount: { type: Number, default: 0, min: 0 },

		discountMethod: { type: String, default: "percent", enum: ["percent", "fixed"] },

		shipping: { type: Number, default: 0, min: 0 },

		total: { type: Number, required: true, min: 1 },

		paid: { type: Number, default: 0, min: 0 },

		details: { type: [detailSchema], required: true, min: 1 },

		payments: { type: [paymentSchema], default: [] },

		status: { type: Schema.Types.ObjectId, ref: "Status", required: true },

		notes: { type: String, trim: true, maxlength: 254, default: "" },

		deletedAt: { type: Date, default: null },

		deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

		createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

		updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
	},
	{ timestamps: true, counters: { field: "reference", prefix: (count) => "SL_" + (count + 1110) } }
);

module.exports = saleSchema;
