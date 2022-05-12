const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const paymentTypes = ["cash", "creditCard", "cheque", "bankTransfer", "westernUnion", "other"];

const paymentSchema = new Schema(
	{
		date: { type: Date, default: Date.now },

		amount: { type: Number, required: true },

		paymentType: { type: String, default: "cash", trim: true, lowercase: true, enum: paymentTypes },

		notes: { type: String, trim: true, lowercase: true, maxlength: 254, default: "" },

		createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

		updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
	},
	{ timestamps: true, counters: { field: "reference", prefix: (n) => "INV/PR_" + (n + 1110), name: "PurchaseReturnPayment" } }
);

module.exports = paymentSchema;
