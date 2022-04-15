const mongoose = require("mongoose");

const invoiceSchema = require("./schemas/InvoiceSchema");

const { exists, notFound, createError } = require("../../errors/ErrorHandler");

class Invoice {
	getStatusById(id) {
		if (!id) return undefined;

		return this.statuses.find((status) => status._id.toString() === id.toString());
	}

	getStatusByName(name) {
		if (!name) return undefined;

		return this.statuses.find((status) => status.name.toLowerCase() === name.toLowerCase());
	}

	addStatus(status) {
		// check unique name
		this.statuses = this.statuses || [];

		if (this.statuses.length) {
			let oldStatus = this.getStatusByName(status.name);
			if (oldStatus) throw exists();
		} else {
			status.effected = true;
		}

		this.statuses.push(status);

		return this;
	}

	updateStatus(status) {
		let oldStatus = this.getStatusById(status._id);

		if (!oldStatus) throw notFound();

		// check unique name
		let statusHasSameName = this.getStatusByName(status.name);

		statusHasSameName = statusHasSameName && statusHasSameName._id.toString() !== status._id.toString();

		if (statusHasSameName) throw exists();

		if (status.hasOwnProperty("effected")) delete status.effected;

		status.updatedAt = new Date();

		for (let k in status) {
			oldStatus[k] = status[k];
		}

		return this;
	}

	deleteStatus(id) {
		let status = this.getStatusById(id);

		if (!status) throw notFound();

		if (status.effected) throw createError({ field: "_id", message: { type: "effected" } });

		this.statuses = this.statuses.filter((status) => status._id.toString() !== id.toString());

		return this;
	}

	setStatusEffected(id, updatedBy) {
		let status = this.getStatusById(id);

		if (!status) throw notFound();

		if (status.effected) return this;

		let oldEffectedStatus = this.statuses.find((status) => status.effected);

		if (!oldEffectedStatus) return this;

		let oldEffected = { ...oldEffectedStatus._doc };

		delete oldEffected.effected;
		delete oldEffected._id;

		for (let k in oldEffected) {
			oldEffectedStatus[k] = status[k];
			status[k] = oldEffected[k];
		}

		status.updatedBy = updatedBy;

		status.updatedAt = new Date();

		return this;
	}
}

invoiceSchema.loadClass(Invoice);

invoiceSchema.static("isStatusExist", function (invoiceName, id, select = "_id") {
	// return this.statuses.find((status) => status.name.toLowerCase() === name.toLowerCase());
	return this.findOne({ name: invoiceName, "statuses._id": id }, select);
});

module.exports = mongoose.model("Invoice", invoiceSchema);
