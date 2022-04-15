const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const permissionSchema = new Schema(
	{
		_id: { type: String, required: true },
	},
	{ timestamps: false, versionKey: false }
);

module.exports = mongoose.model("Permission", permissionSchema);
