const mongoose = require("mongoose");

const saleReturnSchema = require("./schemas/SaleReturnSchema");

const Model = require("../../plugins/Model");

const { notFound } = require("../../errors/ErrorHandler");

class SaleReturn extends Model {
	get fillable() {
		return ["date", "customer", "warehouse", "tax", "discount", "discountMethod", "shipping", "status", "notes"];
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

	addPayment(payment) {
		payment = { date: payment.date, amount: payment.amount, paymentType: payment.paymentType, notes: payment.notes, createdBy: payment.createdBy };

		this.payments.push(payment);

		this.calculatePaid();

		return this;
	}

	getPayment(paymentId) {
		return this.payments.find((payment) => payment._id.toString() === paymentId.toString());
	}

	editPayment(paymentId, payment) {
		let oldPayment = this.getPayment(paymentId);

		if (!oldPayment) throw notFound("paymentId");

		oldPayment.date = payment.date;
		oldPayment.amount = payment.amount;
		oldPayment.paymentType = payment.paymentType;
		oldPayment.notes = payment.notes;
		oldPayment.updatedBy = payment.updatedBy;

		this.calculatePaid();

		return this;
	}

	deletePayment(paymentId) {
		let index = this.payments.findIndex((payment) => payment._id.toString() === paymentId.toString());

		if (index === -1) throw notFound("paymentId");

		this.payments.splice(index, 1);

		this.calculatePaid();

		return this;
	}
}

saleReturnSchema.loadClass(SaleReturn);

module.exports = mongoose.model("SaleReturn", saleReturnSchema);
