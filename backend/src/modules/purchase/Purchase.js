const mongoose = require("mongoose");

const purchaseSchema = require("./schemas/PurchaseSchema");

const Model = require("../../plugins/Model");

class Purchase extends Model {
	get fillable() {
		return ["date", "supplier", "warehouse", "tax", "discount", "discountMethod", "shipping", "status", "notes"];
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

	get paymentStatus() {
		if (this.paid === 0) {
			return "unpaid";
		}

		if (this.paid === this.total) {
			return "paid";
		}

		return "partial";
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

	calculatePaid() {
		this.paid = this.payments.reduce((total, payment) => total + payment.amount, 0);

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

purchaseSchema.loadClass(Purchase);

module.exports = mongoose.model("Purchase", purchaseSchema);
