const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const paymentMethods = ["cash", "creditCard", "cheque", "bankTransfer", "westernUnion", "other"];

const paymentSchema = new Schema(
	{
		date: { type: Date, default: Date.now },

		amount: { type: Number, required: true },

		paymentMethods: { type: String, default: "cash", lowercase: true, enum: paymentMethods },

		notes: { type: String, trim: true, maxlength: 254, default: "" },
	},
	{ timestamps: true, counters: { field: "reference", prefix: "INV/PR_" } }
);

module.exports = paymentSchema;
