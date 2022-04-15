let mongoose = require("mongoose"),
	Schema = mongoose.Schema,
	Model = mongoose.Model;

module.exports = function (schema, options) {
	schema.add({
		deletedAt: { type: Boolean, default: null },
		deletedBy: { type: Schema.Types.ObjectId, default: null },
	});

	schema.pre("save", function (next) {
		if (!this.deletedAt) {
			this.deletedAt = null;
			this.deletedBy = null;
		}

		next();
	});

	let methods = [
		"find",
		"findOne",
		"findById",
		"findOneAndUpdate",
		"updateOne",
		"updateOneById",
		"updateMany",
		"deleteOne",
		"deleteOneById",
		"deleteMany",
		"count",
		"countDocuments",
	];

	methods.forEach((method) => {
		if (["find", "findOne", "findById", "count", "countDocuments"].includes(method)) {
			schema.statics[method] = function () {
				let query = Model[method].apply(this, arguments);

				return query.where({ deletedAt: null });
			};
		}
	});
};
