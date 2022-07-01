const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const detailSchema = new Schema({
	quantity: { type: Number, required: true },

	variant: { type: Schema.Types.ObjectId, ref: "Variant", required: true },

	product: { type: Schema.Types.ObjectId, ref: "Product", required: true },

	unit: { type: Schema.Types.ObjectId, ref: "Unit", required: true }, // this is only to get the right unit if it has been changed from the product or deleted by user

	subUnit: { type: Schema.Types.ObjectId, ref: "Unit", required: true },

	type: { type: String, enum: ["subtraction", "addition"], lowercase: true, trim: true, required: true },
});

class Detail {
	/* 
		* Before accessing the instockBySubUnit, we need to populate the subUnit field first
		@return instock depends on the subUnit of the product and the subUnit of the detail
	*/
	get instockBySubUnit() {
		let isMultiple = this.subUnit.operator === "*";

		return isMultiple ? this.quantity * +this.subUnit.value : this.quantity / +this.subUnit.value;
	}

	get isAddition() {
		return this.type === "addition";
	}
}

detailSchema.loadClass(Detail);

module.exports = detailSchema;
