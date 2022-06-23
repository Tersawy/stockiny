const mongoose = require("mongoose");

const variantSchema = require("./schemas/VariantSchema");

const Model = require("../../plugins/Model");

const { getID } = require("../../utils/functions");

class Variant extends Model {
	get instock() {
		return this.stocks.reduce((total, curr) => total + +curr.instock, 0);
	}

	get defaultImage() {
		let image = this.images.find(image => !!image.default);

		if (image) return image.name;

		return null;
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
		let id = getID(warehouse);

		if (!id) throw new Error("warehouse id is required to get stock");

		if (this.stocks.length > 0) {
			return this.stocks.find((stock) => stock.warehouse.toString() === id.toString());
		}

		return null;
	}

	getInstockByWarehouse(warehouse) {
		let stock = this.getStock(warehouse);

		if (stock) {
			return stock.instock;
		}

		return 0;
	}

	addToStock({ warehouse, quantity }) {
		let oldStock = this.getStock(warehouse);

		if (oldStock) {
			oldStock.instock += quantity;
		} else {
			let id = getID(warehouse);

			this.stocks.push({ warehouse: id, instock: quantity });
		}

		return this;
	}

	subtractFromStock({ warehouse, quantity }) {
		let oldStock = this.getStock(warehouse);

		if (oldStock) {
			oldStock.instock -= quantity;
		}

		return this;
	}
}

variantSchema.loadClass(Variant);

module.exports = mongoose.model("Variant", variantSchema);
