const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const unitSchema = new Schema(
	{
		name: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 54 }, // Unique

		shortName: { type: String, required: true, lowercase: true, trim: true, minlength: 1, maxlength: 20 }, // Unique

		value: { type: Number, required: true, min: 1, default: 1 },

		operator: { type: String, trim: true, enum: ["*", "/"], default: "*" },

		base: { type: Schema.Types.ObjectId, ref: "Unit", default: null },

		deletedAt: { type: Date, default: null },

		deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

		createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

		updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
	},
	{ timestamps: true }
);

const Model = require("../../plugins/Model");

class Unit extends Model {}

unitSchema.loadClass(Unit);

module.exports = mongoose.model("Unit", unitSchema);
