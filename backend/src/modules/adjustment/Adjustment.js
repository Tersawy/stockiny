const mongoose = require("mongoose");

const adjustmentSchema = require("./schemas/AdjustmentSchema");

const Model = require("../../plugins/Model");

class Adjustment extends Model {
	get fillable() {
		return ["date", "warehouse", "status", "notes"];
	}

	by(userId) {
		if (this.isNew) {
			this.createdBy = userId;
		} else {
			this.updatedBy = userId;
		}

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

		return this;
	}
}

adjustmentSchema.loadClass(Adjustment);

module.exports = mongoose.model("Adjustment", adjustmentSchema);
