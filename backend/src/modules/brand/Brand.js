const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const brandSchema = new Schema(
	{
		name: { type: String, required: true, lowercase: true, trim: true, minlength: 2, maxlength: 54 }, // Unique

		description: { type: String, trim: true, maxlength: 254, default: "" },

		image: { type: String, trim: true, minlength: 3, maxlength: 254, default: "" },

		deletedAt: { type: Date, default: null },

		deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

		createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

		updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
	},
	{ timestamps: true }
);

const Model = require("../../plugins/Model");

class Brand extends Model {}

brandSchema.loadClass(Brand);

module.exports = mongoose.model("Brand", brandSchema);
