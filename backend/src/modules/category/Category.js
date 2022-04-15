const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const categorySchema = new Schema(
	{
		name: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 54 }, // Unique

		code: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 20 }, // Unique

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

class Category extends Model {}

categorySchema.loadClass(Category);

module.exports = mongoose.model("Category", categorySchema);
