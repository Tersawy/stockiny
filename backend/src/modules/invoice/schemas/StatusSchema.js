const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let statusSchema = new Schema({
	name: { type: String, lowercase: true, trim: true, minlength: 3, maxlength: 54, required: true }, // unique

	description: { type: String, trim: true, maxlength: 254, default: "" },

	color: { type: String, trim: true, maxlength: 20, default: "#000000" },

	effected: { type: Boolean, default: false },

	createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

	updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

	// Added Timestamps manually to change it by force in change effected to keep sorting works successfuly
	createdAt: { type: Date, default: Date.now },

	updatedAt: { type: Date, default: null },
});

module.exports = statusSchema;
