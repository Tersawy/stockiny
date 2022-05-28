const mongoose = require("mongoose");

const transferSchema = require("./schemas/TransferSchema");

const Model = require("../../plugins/Model");

class Transfer extends Model {
	get fillable() {
		return ["date", "fromWarehouse", "toWarehouse", "tax", "discount", "discountMethod", "shipping", "status", "notes"];
	}

	get detailsTotalAmount() {
		return this.details.reduce((total, detail) => total + detail.total, 0);
	}

	get taxAmount() {
		return this.totalAfterDiscount * (this.tax / 100);
	}

	get discountAmount() {
		if (this.discountMethod == "percent") {
			return this.detailsTotalAmount * (this.discount / 100);
		}

		return this.discount;
	}

	get totalAfterDiscount() {
		return this.detailsTotalAmount - this.discountAmount;
	}

	by(userId) {
		if (this.isNew) {
			this.createdBy = userId;
		} else {
			this.updatedBy = userId;
		}

		return this;
	}

	calculateTotal() {
		this.total = this.totalAfterDiscount + this.taxAmount + this.shipping;

		return this;
	}

	fill(data) {
		for (let key in data) {
			if (this.fillable.includes(key)) {
				this[key] = data[key];
			}
		}

		return this;
	}

	addDetails(details) {
		this.details = details;

		for (let detail of this.details) {
			detail.calculateTotal();
		}

		this.calculateTotal();

		return this;
	}
}

transferSchema.loadClass(Transfer);

module.exports = mongoose.model("Transfer", transferSchema);
