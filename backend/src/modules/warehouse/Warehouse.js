const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const warehouseSchema = new Schema(
	{
		name: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 54 }, // Unique

		phone: { type: String, required: true, trim: true, minlength: 6, maxlength: 18 }, // Unique

		email: { type: String, required: true, lowercase: true, trim: true, minlength: 6, maxlength: 254 }, // Unique

		country: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 54 },

		city: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 54 },

		address: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 54 },

		zipCode: { type: String, required: true, trim: true, minlength: 3, maxlength: 20 },

		deletedAt: { type: Date, default: null },

		deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

		createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

		updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
	},
	{ timestamps: true }
);

const Model = require("../../plugins/Model");

class Warehouse extends Model {}

warehouseSchema.loadClass(Warehouse);

module.exports = mongoose.model("Warehouse", warehouseSchema);
