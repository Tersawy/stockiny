const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ObjectId = Schema.Types.ObjectId;

const Model = require("../../plugins/Model");

const { exists } = require("../../errors/ErrorHandler");

const productSchema = new Schema(
	{
		name: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 54 }, // Unique

		barcodeType: { type: String, required: true, trim: true, minlength: 3, maxlength: 20 },

		code: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 20 }, // Unique

		price: { type: Number, required: true, min: 1 },

		cost: { type: Number, required: true, min: 1 },

		minimumStock: { type: Number, required: true, min: 0 },

		tax: { type: Number, required: true, min: 0, max: 100 },

		taxMethod: { type: String, required: true, enum: ["inclusive", "exclusive"] },

		category: { type: ObjectId, ref: "Category", required: true },

		brand: { type: ObjectId, ref: "Brand", required: true },

		unit: { type: ObjectId, ref: "Unit", required: true },

		purchaseUnit: { type: ObjectId, ref: "Unit", required: true },

		saleUnit: { type: ObjectId, ref: "Unit", required: true },

		variants: [{ type: ObjectId, ref: "Variant" }],

		image: { type: String, default: "" },

		availableForSale: { type: Boolean, default: false },

		availableForPurchase: { type: Boolean, default: false },

		availableForSaleReturn: { type: Boolean, default: false },

		availableForPurchaseReturn: { type: Boolean, default: false },

		notes: { type: String, trim: true, maxlength: 254, default: "" },

		deletedAt: { type: Date, default: null },

		deletedBy: { type: ObjectId, ref: "User", default: null },

		createdBy: { type: ObjectId, ref: "User", required: true },

		updatedBy: { type: ObjectId, ref: "User", default: null },
	},
	{ timestamps: true }
);

class Product extends Model {
	get fillable() {
		return [
			"name",
			"barcodeType",
			"code",
			"price",
			"cost",
			"minimumStock",
			"tax",
			"taxMethod",
			"category",
			"brand",
			"unit",
			"purchaseUnit",
			"saleUnit",
			"notes",
			"availableForSale",
			"availableForPurchase",
		];
	}

	get instock() {
		return this.variants.reduce((total, curr) => total + +curr.instock, 0);
	}

	fill(data) {
		for (let d of this.fillable) {
			if (typeof data[d] !== "undefined") this[d] = data[d];
		}

		return this;
	}

	getVariantById(id) {
		if (!id) return undefined;

		return this.variants.find((v) => v._id.toString() === id.toString());
	}

	addToStock({ warehouse, variant, quantity }) {
		variant = this.getVariantById(variant);

		if (!variant) return;

		variant.addToStock({ quantity, warehouse });

		return this;
	}

	subtractFromStock({ warehouse, variant, quantity }) {
		variant = this.getVariantById(variant);

		if (!variant) return;

		variant.subtractFromStock({ quantity, warehouse });

		return this;
	}
}

productSchema.loadClass(Product);

module.exports = mongoose.model("Product", productSchema);
