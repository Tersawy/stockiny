const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const statusSchema = require("./StatusSchema");

const invoiceSchema = new Schema({
	/*
   ! name field is set by project setup and not editable by user
	 * example: "purcahse", "sale", "purcahseReturn", "saleReturn"
  */
	name: { type: String, required: true }, // unique

	statuses: { type: [statusSchema], required: true, min: 1 },
});

module.exports = invoiceSchema;
