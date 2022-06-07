const mongoose = require("mongoose");

const detailSchema = require("./DetailSchema");

const Schema = mongoose.Schema;

const adjustmentSchema = new Schema(
	{
		date: { type: Date, default: Date.now },

		warehouse: { type: Schema.Types.ObjectId, ref: "Warehouse" },

		details: { type: [detailSchema], required: true, min: 1 },

		status: { type: Schema.Types.ObjectId, ref: "Status", required: true },

		notes: { type: String, trim: true, maxlength: 254, default: "" },

		deletedAt: { type: Date, default: null },

		deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

		createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

		updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
	},
	{ timestamps: true, counters: { field: "reference", prefix: (count) => "AD_" + (count + 1110) } }
);

module.exports = adjustmentSchema;
