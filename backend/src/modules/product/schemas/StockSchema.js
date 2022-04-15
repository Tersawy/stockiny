const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const stockSchema = new Schema(
	{
		quantity: { type: Number, required: true, min: 0 },

		warehouse: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true }, // Unique
	},
	{ _id: false }
);

class Stock {}

stockSchema.loadClass(Stock);

module.exports = stockSchema;
