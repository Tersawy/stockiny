const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const detailSchema = new Schema({
	amount: { type: Number, required: true },

	quantity: { type: Number, required: true },

	tax: { type: Number, default: 0, min: 0, max: 100 },

	taxMethod: { type: String, default: "exclusive", lowercase: true, trim: true, enum: ["inclusive", "exclusive"] },

	discount: { type: Number, default: 0, min: 0 },

	discountMethod: { type: String, default: "percent", lowercase: true, trim: true, enum: ["percent", "fixed"] },

	variant: { type: Schema.Types.ObjectId, required: true },

	product: { type: Schema.Types.ObjectId, ref: "Product", required: true },

	unit: { type: Schema.Types.ObjectId, ref: "Unit", required: true }, // this is only to get the right unit if it has been changed from the product or deleted by user

	subUnit: { type: Schema.Types.ObjectId, ref: "Unit", required: true },

	total: { type: Number, required: true },
});

class Detail {
	calculateTotal() {
		this.total = this.quantity * this.amountAfterDiscountAndTax;

		return this;
	}

	/* 
		! This is only for exclusive tax
		! This is only for exclusive tax
		? That's not true for inclusive tax and it's not even clear what it should be
		? it just returns the tax amount to be added to the net amount if the tax is exclusive
		* to get the tax amount for inclusive tax, we need to divide (the amount - discount) by (1 + tax / 100), but 
		* that's unnecessary because we already have the amount and we want to get the tax amount to be added to the net amount
	*/
	get taxAmount() {
		let isExclusive = this.taxMethod == "exclusive";

		if (!this.tax || !isExclusive) return 0;

		return this.amountAfterDiscount * (this.tax / 100);
	}

	get discountAmount() {
		let isFixed = this.discountMethod == "fixed";

		if (isFixed) return this.discount;

		return this.discount * (this.amount / 100);
	}

	get amountAfterDiscount() {
		return this.amount - this.discountAmount;
	}

	get amountAfterDiscountAndTax() {
		return this.amountAfterDiscount + this.taxAmount;
	}

	/* 
		!* Before accessing the stock, we need to populate the subUnit field first
		@return stock depends on the amountUnit of the product and the subUnit of the detail
	*/
	get stock() {
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
