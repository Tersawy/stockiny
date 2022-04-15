let mongoose = require("mongoose"),
	mongooseSchema = mongoose.Schema,
	mongooseModel = mongoose.Model;

class Model {
	static find(query = {}, ...args) {
		query.deletedAt = null;
		return mongooseModel.find.call(this, query, ...args);
	}

	static findDeleted(query = {}, ...args) {
		query.deletedAt = { $ne: null };
		return mongooseModel.find.call(this, query, ...args);
	}

	static findWithDeleted(query = {}, ...args) {
		return mongooseModel.find.call(this, query, ...args);
	}

	static findOne(query, ...args) {
		query.deletedAt = null;
		return mongooseModel.findOne.call(this, query, ...args);
	}

	static findOneDeleted(query, ...args) {
		query.deletedAt = { $ne: null };
		return mongooseModel.findOne.call(this, query, ...args);
	}

	static findOneWithDeleted(query, ...args) {
		return mongooseModel.findOne.call(this, query, ...args);
	}

	static findById(_id, ...args) {
		let query = { _id, deletedAt: null };
		return mongooseModel.findOne.call(this, query, ...args);
	}

	static findByIdDeleted(_id, ...args) {
		let query = { _id, deletedAt: { $ne: null } };
		return mongooseModel.findOne.call(this, query, ...args);
	}

	static findByIdWithDeleted(_id, ...args) {
		return mongooseModel.findById.call(this, _id, ...args);
	}

	static updateOne(query, update, ...args) {
		query.deletedAt = null;
		delete update.deletedAt;
		return mongooseModel.updateOne.call(this, query, update, ...args);
	}

	static updateMany(query = {}, update, ...args) {
		query.deletedAt = null;
		delete update.deletedAt;
		return mongooseModel.updateMany.call(this, query, update, ...args);
	}

	static deleteOne(query, userId, ...args) {
		query.deletedAt = null;
		let update = { deletedAt: Date.now(), deletedBy: userId };
		return mongooseModel.updateOne.call(this, query, update, ...args);
	}

	static deleteById(_id, userId, ...args) {
		let query = { _id, deletedAt: null };
		let update = { deletedAt: Date.now(), deletedBy: userId };
		return mongooseModel.updateOne.call(this, query, update, ...args);
	}

	static deleteMany(query = {}, userId, ...args) {
		query.deletedAt = null;
		let update = { deletedAt: Date.now(), deletedBy: userId };
		return mongooseModel.updateMany.call(this, query, update, ...args);
	}

	static count(query = {}, ...args) {
		query.deletedAt = null;
		return mongooseModel.count.call(this, query, ...args);
	}

	static countDocuments(query = {}, ...args) {
		query.deletedAt = null;
		return mongooseModel.countDocuments.call(this, query, ...args);
	}

	static findOneAndUpdate(query, update, ...args) {
		query.deletedAt = null;
		delete update.deletedAt;
		return mongooseModel.findOneAndUpdate.call(this, query, update, ...args);
	}

	static findByIdAndUpdate(_id, update, ...args) {
		let query = { _id, deletedAt: null };
		delete update.deletedAt;
		return mongooseModel.findOneAndUpdate.call(this, query, update, ...args);
	}

	static findOneAndDelete(query, userId, ...args) {
		query.deletedAt = null;
		let update = { deletedAt: Date.now(), deletedBy: userId };
		return mongooseModel.findOneAndUpdate.call(this, query, update, ...args);
	}

	static findByIdAndDelete(_id, userId, ...args) {
		let query = { _id, deletedAt: null };
		let update = { deletedAt: Date.now(), deletedBy: userId };
		return mongooseModel.findOneAndUpdate.call(this, query, update, ...args);
	}

	static restoreOne(query, ...args) {
		query.deletedAt = { $ne: null };
		let update = { deletedAt: null };
		return mongooseModel.updateOne.call(this, query, update, ...args);
	}

	static restoreMany(query = {}, ...args) {
		query.deletedAt = { $ne: null };
		let update = { deletedAt: null };
		return mongooseModel.updateMany.call(this, query, update, ...args);
	}

	static restoreById(_id, ...args) {
		let query = { _id, deletedAt: { $ne: null } };
		let update = { deletedAt: null };
		return mongooseModel.updateOne.call(this, query, update, ...args);
	}

	static forceDeleteOne() {
		return mongooseModel.deleteOne.apply(this, arguments);
	}

	static forceDeleteMany() {
		return mongooseModel.deleteMany.apply(this, arguments);
	}

	static forceDeleteById(_id, ...args) {
		return mongooseModel.deleteOne.call(this, { _id }, ...args);
	}

	delete() {
		this.deletedAt = Date.now();
		return this.save(arguments);
	}

	// remove() {
	// 	this.deletedAt = Date.now();
	// 	return this.save(arguments);
	// }

	// removeBy(userId, ...args) {
	// 	this.deletedAt = Date.now();
	// 	this.deletedBy = userId;
	// 	return this.save(...args);
	// }

	deleteBy(userId, ...args) {
		this.deletedAt = Date.now();
		this.deletedBy = userId;
		return this.save(...args);
	}

	restore() {
		this.deletedAt = null;
		this.deletedBy = null;
		return this.save(arguments);
	}

	forceDelete() {
		return this.remove(arguments);
	}
}

module.exports = Model;
