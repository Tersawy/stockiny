const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const stockSchema = require("./StockSchema");

const imageSchema = require("./ImageSchema");

const variantSchema = new Schema(
	{
		name: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 54 }, // Unique

		stock: [stockSchema],

		images: [imageSchema],

		availableForSale: { type: Boolean, default: false },

		availableForPurchase: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

class Variant {
	get instock() {
		return this.stock.reduce((total, curr) => total + +curr.quantity, 0);
	}

	setDefaultImage(name) {
		if (this.images.length > 0) {
			this.images.forEach((image) => {
				if (image.name === name) {
					image.default = true;
				} else {
					image.default = false;
				}
			});
		}
	}

	getStock(warehouse) {
		if (this.stock.length > 0) {
			return this.stock.find((stock) => stock.warehouse.toString() === warehouse.toString());
		}

		return null;
	}

	addToStock({ warehouse, quantity }) {
		let oldStock = this.getStock(warehouse);

		if (oldStock) {
			oldStock.quantity += quantity;
		} else {
			this.stock.push({ warehouse, quantity });
		}

		return this;
	}
}

variantSchema.loadClass(Variant);

module.exports = variantSchema;
