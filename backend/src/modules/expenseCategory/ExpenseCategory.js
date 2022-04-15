const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const expenseCategorySchema = new Schema(
	{
		name: { type: String, required: true, trim: true, lowercase: true, minlength: 3, maxlength: 54 }, // Unique

		description: { type: String, trim: true, maxlength: 254, default: "" },

		deletedAt: { type: Date, default: null },

		deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

		createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

		updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
	},
	{ timestamps: true }
);

const Model = require("../../plugins/Model");

class ExpenseCategory extends Model {}

expenseCategorySchema.loadClass(ExpenseCategory);

module.exports = mongoose.model("ExpenseCategory", expenseCategorySchema);
