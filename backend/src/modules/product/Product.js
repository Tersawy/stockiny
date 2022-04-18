const mongoose = require("mongoose");

const productSchema = require("./schemas/ProductSchema");

const Model = require("../../plugins/Model");

const { exists } = require("../../errors/ErrorHandler");

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

	getVariantByName(name) {
		if (!name) return undefined;

		return this.variants.find((v) => v.name.toString() === name.toString());
	}

	addVariant(variant) {
		// check unique name
		this.variants = this.variants || [];

		let oldVariant = this.getVariantByName(variant.name);

		if (oldVariant) throw exists();

		this.variants.push(variant);

		return this;
	}

	addToStock({ warehouse, variant, quantity }) {
		variant = this.getVariantById(variant);

		if (!variant) return;

		variant.addToStock({ quantity, warehouse });
	}

	subtractFromStock({ warehouse, variant, quantity }) {
		variant = this.getVariantById(variant);

		if (!variant) return;

		variant.subtractFromStock({ quantity, warehouse });
	}
}

productSchema.loadClass(Product);

module.exports = mongoose.model("Product", productSchema);
