const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const detailSchema = new Schema({
	amount: { type: Number, required: true },

	quantity: { type: Number, required: true },

	tax: { type: Number, default: 0, min: 0, max: 100 },

	taxMethod: { type: String, default: "exclusive", lowercase: true, trim: true, enum: ["inclusive", "exclusive"] },

	discount: { type: Number, default: 0, min: 0 },

	discountMethod: { type: String, default: "percent", lowercase: true, trim: true, enum: ["percent", "fixed"] },

	variant: { type: Schema.Types.ObjectId, ref: "Variant", required: true },

	product: { type: Schema.Types.ObjectId, ref: "Product", required: true },

	unit: { type: Schema.Types.ObjectId, ref: "Unit", required: true }, // this is only to get the right unit if it has been changed from the product or deleted by user

	subUnit: { type: Schema.Types.ObjectId, ref: "Unit", required: true },

	total: { type: Number, required: true },
});

class Detail {
	calculateTotal() {
		let isExclusive = this.taxMethod == "exclusive";

		let taxAmount = !this.tax || !isExclusive ? 0 : this.amountAfterDiscount * (this.tax / 100);

		this.total = this.quantity * (this.amountAfterDiscount + taxAmount);

		return this;
	}

	get amountAfterDiscount() {
		let isFixed = this.discountMethod == "fixed";

		let discountAmount = isFixed ? this.discount : this.discount * (this.amount / 100);

		return this.amount - discountAmount;
	}

	/* 
		* Before accessing the stock, we need to populate the subUnit field first
		@return stock depends on the amountUnit (e.g. purchaseUnit, saleUnit) of the product and the subUnit of the detail
	*/
	get instockBySubUnit() {
		let isMultiple = this.subUnit.operator === "*";

		return isMultiple ? this.quantity * +this.subUnit.value : this.quantity / +this.subUnit.value;
	}

	/* 
		!* Before accessing the amountUnit, we need to populate the subUnit field first
		@return amountUnit depends on the main unit (e.g. unit) of the product and the unit of the detail
	*/
	get unitAmount() {
		let amount = +this.amount;

		let subUnitId = this.subUnit._id.toString();

		let mainUnitId = this.unit.toString();

		let subUnitIsMainUnit = mainUnitId === subUnitId;

		if (subUnitIsMainUnit) return amount;

		let isMultiple = this.subUnit.operator === "*";

		// reverse the operator to get the amountUnit depending on the unit (product unit)
		amount = isMultiple ? amount / +this.subUnit.value : amount * +this.subUnit.value;

		return amount;
	}
}

detailSchema.loadClass(Detail);

module.exports = detailSchema;
