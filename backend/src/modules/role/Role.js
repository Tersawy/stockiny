const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const roleSchema = new Schema(
	{
		name: { type: String, required: true, minlength: 3, maxlength: 54, lowercase: true, trim: true },

		permissions: { type: [{ type: String, ref: "Permission" }], required: true },

		createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

		updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Role", roleSchema);
