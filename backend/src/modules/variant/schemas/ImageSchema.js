const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const imageSchema = new Schema(
	{
		name: { type: String, required: true, trim: true, minlength: 3, maxlength: 54 },

		default: { type: Boolean, required: true, default: false },
	},
	{ _id: false }
);

class Image {}

imageSchema.loadClass(Image);

module.exports = imageSchema;
