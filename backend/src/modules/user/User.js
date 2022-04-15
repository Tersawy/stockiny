const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema(
	{
		username: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 54 }, // Unique

		fullname: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 54 },

		phone: { type: String, required: true, trim: true, minlength: 6, maxlength: 18 }, // Unique

		email: { type: String, required: true, lowercase: true, trim: true, minlength: 6, maxlength: 254 }, // Unique

		country: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 54 },

		city: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 54 },

		address: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 54 },

		zipCode: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 20 },

		image: { type: String, default: "" },

		password: { type: String, required: true },

		isOwner: { type: Boolean, default: false },

		permissions: { type: [{ type: String, ref: "Permission" }], default: [] },

		role: { type: Schema.Types.ObjectId, ref: "Role", default: null },

		isActive: { type: Boolean, default: true },

		resetPasswordToken: { type: String, default: "" },

		resetPasswordExpires: { type: Date, default: Date.now() + 1800000 },

		deletedAt: { type: Date, default: null },

		deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

		createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

		updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
	},
	{ timestamps: true }
);

const Model = require("../../plugins/Model");

const bcrypt = require("bcrypt");

class User extends Model {
	static findByEmail(email) {
		return this.findOne({ email });
	}

	static findByResetPasswordToken(token) {
		return this.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } }).onlyActive();
	}

	mergePermissions() {
		let permissionsRole = (this.role && Array.isArray(this.role.permissions) && this.role.permissions) || [];

		let permissions = (Array.isArray(this.permissions) && this.permissions) || [];

		this._doc.permissions = [...new Set([...permissionsRole, ...permissions])];

		if (this._doc.role && this._doc.role.permissions) {
			delete this._doc.role.permissions;
		}

		return this;
	}

	isPasswordMatch(password) {
		return bcrypt.compare(password, this.password);
	}

	async setPassword(password) {
		if (!password || !password.length) return this;

		this.password = await bcrypt.hash(password, 10);

		return this;
	}

	get fillable() {
		return [
			"username",
			"fullname",
			"phone",
			"email",
			"country",
			"city",
			"address",
			"zipCode",
			"image",
			"permissions",
			"role",
			"isActive",
		];
	}

	fill(data) {
		for (let d of this.fillable) {
			if (typeof data[d] !== "undefined") this[d] = data[d];
		}

		return this;
	}

	hasAnyPermission(permissions) {
		return this.isOwner || permissions.some((p) => this.permissions.includes(p));
	}

	hasPermissions(permissions) {
		return this.isOwner || permissions.every((p) => this.permissions.includes(p));
	}
}

userSchema.query.withPermissions = function () {
	return this.populate({
		path: "role",
		select: "name permissions",
	});
};

userSchema.query.onlyActive = function () {
	return this.where({ isActive: true });
};

userSchema.loadClass(User);

module.exports = mongoose.model("User", userSchema);
