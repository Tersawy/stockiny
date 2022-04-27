const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const statusSchema = new Schema({
    name: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 54 }, // Unique with invoice

    color: { type: String, required: true, trim: true, maxlength: 20, default: "#000000" },

    description: { type: String, required: true, trim: true, minlength: 3, maxlength: 254 },

    effected: { type: Boolean, default: false },

    invoice: { type: String, required: true, enum: ["purchases", "purchasesReturn", "sales", "salesReturn"] },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

    deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

    // Added Timestamps manually to change it by force in change effected to keep sorting works successfuly
    createdAt: { type: Date, default: Date.now },

    updatedAt: { type: Date, default: null },

    deletedAt: { type: Date, default: null },
});

module.exports = mongoose.model("Status", statusSchema);