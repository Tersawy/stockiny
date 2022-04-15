const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const saleDetailSchema = new Schema({
	price: { type: Number, required: true },

	quantity: { type: Number, required: true },

	tax: { type: Number, default: 0 },

	taxMethod: { type: String, default: "exclusive", enum: ["inclusive", "exclusive"] },

	discount: { type: Number, default: 0 },

	discountMethod: { type: String, default: "percent", enum: ["percent", "amount"] },

	variant: { type: Schema.Types.ObjectId },

	product: { type: Schema.Types.ObjectId, required: true },

	saleUnit: { type: Schema.Types.ObjectId, ref: "Unit", required: true },
});

const saleSchema = new Schema(
	{
		reference: { type: String, required: true }, // Unique

		tax: { type: Number, default: 0 },

		discount: { type: Number, default: 0 },

		discountMethod: { type: String, default: "percent", enum: ["percent", "amount"] },

		status: { type: String, default: "completed", enum: ["completed", "pending", "ordered"] },

		paymentStatus: { type: String, default: "pending", enum: ["paid", "unpaid", "partial"] },

		isPos: { type: Boolean, default: false },

		shipping: { type: Number, default: 0 },

		total: { type: Number, default: 0 },

		paid: { type: Number, default: 0 },

		notes: { type: String, default: "" },

		date: { type: Date, default: Date.now },

		customer: { type: Schema.Types.ObjectId, ref: "Customer" },

		warehouse: { type: Schema.Types.ObjectId, ref: "Warehouse" },

		details: { type: [saleDetailSchema], required: true, min: 1 },

		deletedAt: { type: Date, default: null },

		deletedBy: { type: Schema.Types.ObjectId, ref: "User" },

		createdBy: { type: Schema.Types.ObjectId, ref: "User" },

		updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
	},
	{ timestamps: true }
);

const Model = require("../../plugins/Model");

class Sale extends Model {}

saleSchema.loadClass(Sale);

module.exports = mongoose.model("Sale", saleSchema);
