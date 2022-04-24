const mongoose = require("mongoose");

let counterSchema = new mongoose.Schema({
	_id: { type: String, required: true },
	seq: { type: Number, default: 0 },
	del: { type: Number, default: 0 },
});

let Counter = mongoose.model("Counter", counterSchema);

module.exports = (schema) => {
	let defaultOptions = { field: "", prefix: "", disable: false, name: "" };

	let options = Object.assign(defaultOptions, schema.options.counters || {});

	if (options.disable) return;

	let field = (typeof options.field == "string" && options.field.length > 0 && options.field) || "";

	if (field) {
		schema.add({ [options.field]: { type: String, trim: true, minlength: 1, maxlength: 24 } });
	}

	schema.pre("save", async function (next) {
		if (!this.isNew) return next();

		let modelName = options.name || this.constructor.modelName;

		if (field) {
			let counter = await Counter.findOneAndUpdate(
				{ _id: modelName },
				{ $inc: { seq: 1 } },
				{ new: true, upsert: true }
			);

			let seq = counter.seq;

			seq = typeof options.prefix == "function" ? options.prefix(seq, this) : options.prefix.toString() + seq;

			this.set(options.field, seq);

			return next();
		}

		await Counter.updateOne({ _id: modelName }, { $inc: { seq: 1 } }, { upsert: true });

		return next();
	});

	schema.post("save", async function (error, doc, next) {
		if (error) {
			if (error.name == "MongoServerError" && error.code == 11000) {
				await Counter.updateOne({ _id: this.constructor.modelName }, { $inc: { seq: -1 } });
			}

			return next(error);
		}

		next();
	});

	schema.pre("insertMany", async function (next, docs) {
		for (let doc of docs) {
			await this.validate(doc);
		}

		let modelName = this.modelName;

		if (field) {
			let counter = await Counter.findOneAndUpdate(
				{ _id: modelName },
				{ $inc: { seq: docs.length } },
				{ new: true, upsert: true }
			);

			docs.forEach((doc, i) => {
				let seq = counter.seq;

				seq = seq - docs.length + i + 1;

				seq = typeof options.prefix == "function" ? options.prefix(seq, doc) : options.prefix.toString() + seq;

				doc[options.field] = seq;
			});

			return next();
		}

		await Counter.updateOne({ _id: modelName }, { $inc: { seq: docs.length } }, { upsert: true });

		next();
	});

	schema.post("insertMany", async function (error, docs, next) {
		if (error) {
			if (error.name == "MongoBulkWriteError" && error.code == 11000) {
				let docsLength = error.result.result.insertedIds.length;

				let insertedLength = error.result.result.nInserted;

				let diff = docsLength - insertedLength;

				diff = diff * -1;

				await Counter.updateOne({ _id: this.modelName }, { $inc: { seq: diff } });
			}

			return next(error);
		}

		next();
	});

	schema.statics.getSequence = async function () {
		let counter = await Counter.findOne({ _id: this.modelName });

		return (counter && counter.seq) || 0;
	};

	schema.statics.getDel = async function () {
		let counter = await Counter.findOne({ _id: this.modelName });

		return (counter && counter.del) || 0;
	};

	schema.statics.getCount = async function () {
		let counter = await Counter.findOne({ _id: this.modelName });

		return (counter && counter.seq - counter.del) || 0;
	};

	schema.statics.incDel = async function (del = 1) {
		return Counter.updateOne({ _id: this.modelName }, { $inc: { del: del } });
	};
};
