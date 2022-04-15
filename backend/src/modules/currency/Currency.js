const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const currencySchema = new Schema(
	{
		name: { type: String, required: true, trim: true, lowercase: true, minlength: 3, maxlength: 54 }, // Unique

		symbol: { type: String, required: true, trim: true, lowercase: true, minlength: 1, maxlength: 5 }, // Unique

		code: { type: String, required: true, trim: true, lowercase: true, minlength: 1, maxlength: 5 }, // Unique

		deletedAt: { type: Date, default: null },

		deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

		createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

		updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
	},
	{ timestamps: true }
);

const Model = require("../../plugins/Model");

class Currency extends Model {}

currencySchema.loadClass(Currency);

module.exports = mongoose.model("Currency", currencySchema);
