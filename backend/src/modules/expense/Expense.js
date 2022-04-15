const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const expenseSchema = new Schema(
	{
		amount: { type: Number, required: true, min: 1 },

		details: { type: String, trim: true, maxlength: 254, default: "" },

		category: { type: Schema.Types.ObjectId, ref: "ExpenseCategory", required: true },

		warehouse: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },

		date: { type: Date, required: true },

		deletedAt: { type: Date, default: null },

		deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

		createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

		updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
	},
	{ timestamps: true, counters: { field: "reference", prefix: "EX_" } }
);

const Model = require("../../plugins/Model");

class Expense extends Model {}

expenseSchema.loadClass(Expense);

module.exports = mongoose.model("Expense", expenseSchema);
