const mongoose = require("mongoose");

const { createError, notFound } = require("../../errors/ErrorHandler");

const Status = require("../status/Status");

const Adjustment = require("./Adjustment");

exports.getAdjustments = async (req, res) => {
	let select = "date reference warehouse status";

	let filterOptions = { query: req.query, filterationFields: ["date", "warehouse", "status"] };

	let query = Adjustment.find({}, select)
		.withPagination(req.query)
		.withSearch(req.query)
		.withFilter(filterOptions)
		.populate("warehouse", "name")
		.populate("status", "name color");

	let counts = Adjustment.count().withSearch(req.query).withFilter(filterOptions);

	let [docs, total] = await Promise.all([query, counts]);

	res.json({ docs, total });
};

exports.createAdjustment = async (req, res) => {
	let adjustment = new Adjustment().fill(req.body).addDetails(req.body.details).by(req.me._id);

	await adjustment.populate("warehouse status details.subUnit details.variant details.product");

	if (!adjustment.warehouse || adjustment.warehouse.deletedAt != null) throw notFound("warehouse", 422);

	if (!adjustment.status || adjustment.status.deletedAt != null) throw notFound("status", 422);

	let variants = [];

	let errors = [];

	for (let index in adjustment.details) {
		let detail = adjustment.details[index];

		if (!detail.subUnit || detail.subUnit.deletedAt != null) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		if (!detail.product || detail.product.deletedAt != null) throw createError({ field: `details[${index}].product`, type: "notFound" }, 422);

		if (!detail.variant || detail.variant.deletedAt != null) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		let isVariantRelatedWithProduct = detail.product.variants.includes(detail.variant._id.toString());

		if (!isVariantRelatedWithProduct) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		let subUnitIsMainUnit = detail.subUnit._id.toString() == detail.product.unit.toString();

		if (!subUnitIsMainUnit && detail.subUnit.base.toString() !== detail.product.unit.toString()) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		detail.unit = detail.product.unit;

		if (adjustment.status.effected) {
			let instock = detail.variant.getInstockByWarehouse(adjustment.warehouse._id);

			instock = { before: instock, after: instock };

			let quantity = detail.instockBySubUnit;

			if (detail.isAddition) {
				detail.variant.addToStock({ warehouse: adjustment.warehouse._id, quantity });
				instock.after += quantity;
			} else {
				detail.variant.subtractFromStock({ warehouse: adjustment.warehouse._id, quantity });
				instock.after -= quantity;
			}

			if (instock.after < 0) {
				errors.push({
					product: { _id: detail.product._id, name: detail.product.name },
					variant: { _id: detail.variant._id, name: detail.variant.name },
					warehouse: { _id: adjustment.warehouse._id, name: adjustment.warehouse.name, instock },
					unit: detail.unit,
					quantity
				});
				continue;
			}

			detail.variant.subtractFromStock({ warehouse: adjustment.warehouse._id, quantity });

			variants.push(detail.variant);
		}
	}

	if (errors.length) throw createError({ type: "quantity", errors }, 422);

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([adjustment.save({ session }), ...variants.map((variant) => variant.save({ session }))]);

		await session.commitTransaction();

		res.json({ _id: adjustment._id });
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.getAdjustment = async (req, res) => {
	let adjustment = await Adjustment.findById(req.params.id, "date details status warehouse reference createdBy createdAt")
		.populate("warehouse", "name email phone zipCode address city country")
		.populate("details.subUnit", "name")
		.populate("details.product", "name code")
		.populate("details.variant", "name")
		.populate("status", "name color")
		.populate("createdBy", "fullname");

	if (!adjustment) throw notFound();

	let details = adjustment.details.map((detail) => ({
		_id: detail._id,
		product: detail.product,
		variant: detail.variant,
		subUnit: detail.subUnit,
		quantity: detail.quantity,
		type: detail.type
	}));

	res.json({ doc: { ...adjustment.toJSON(), details } });
}

exports.getEditAdjustment = async (req, res) => {
	let select = "date warehouse status reference details notes";

	let adjustment = await Adjustment.findById(req.params.id, select).populate("details.product", "code name image").populate("details.variant", "name images stocks").populate("details.subUnit", "value operator");

	if (!adjustment) throw notFound();

	let details = adjustment.details.map(detail => ({
		product: detail.product._id,
		variantId: detail.variant,
		code: detail.product.code,
		name: detail.product.name,
		variantName: detail.variant.name,
		type: detail.type,
		image: detail.variant.defaultImage || detail.product.image,
		quantity: detail.quantity,
		instock: detail.variant.getInstockByWarehouse(adjustment.warehouse),
		unit: detail.unit,
		subUnit: detail.subUnit._id
	}));

	res.json({ doc: { ...adjustment.toJSON(), details } });
};

exports.updateAdjustment = async (req, res) => {
	let oldAdjustmentQuery = Adjustment.findById(req.params.id).populate("status warehouse details.variant details.product details.subUnit details.unit");

	let adjustment = new Adjustment().fill(req.body).addDetails(req.body.details);

	let [oldAdjustment] = await Promise.all([oldAdjustmentQuery, adjustment.populate("status warehouse details.variant details.product details.subUnit")]);

	if (!oldAdjustment) throw notFound();

	if (!adjustment.warehouse || adjustment.warehouse.deletedAt != null) throw notFound("warehouse", 422);

	if (!adjustment.status || adjustment.status.deletedAt != null) throw notFound("status", 422);

	let variants = [];

	let stocks = [];

	for (let index in adjustment.details) {
		let detail = adjustment.details[index];

		if (!detail.subUnit || detail.subUnit.deletedAt != null) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		if (!detail.product || detail.product.deletedAt != null) throw createError({ field: `details[${index}].product`, type: "notFound" }, 422);

		if (!detail.variant || detail.variant.deletedAt != null) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		let isVariantRelatedWithProduct = detail.product.variants.includes(detail.variant._id.toString());

		if (!isVariantRelatedWithProduct) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		let subUnitIsMainUnit = detail.subUnit._id.toString() == detail.product.unit.toString();

		if (!subUnitIsMainUnit && detail.subUnit.base.toString() !== detail.product.unit.toString()) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		detail.unit = detail.product.unit;

		if (adjustment.status.effected) {
			let instock = detail.variant.getInstockByWarehouse(adjustment.warehouse._id);

			instock = { before: instock, after: instock };

			let quantity = detail.instockBySubUnit;

			if (detail.isAddition) {
				detail.variant.addToStock({ warehouse: adjustment.warehouse._id, quantity });
				instock.after += quantity;
			} else {
				detail.variant.subtractFromStock({ warehouse: adjustment.warehouse._id, quantity });
				instock.after -= quantity;
			}

			stocks.push({
				product: { _id: detail.product._id, name: detail.product.name },
				variant: { _id: detail.variant._id, name: detail.variant.name },
				warehouse: { _id: adjustment.warehouse._id, name: adjustment.warehouse.name, instock },
				unit: detail.unit,
				quantity
			})

			variants.push(detail.variant);
		}
	}

	if (oldAdjustment.status.effected) {
		for (let index in oldAdjustment.details) {
			let detail = oldAdjustment.details[index];

			let sameVariant = variants.find(variant => variant._id.toString() == detail.variant._id.toString());

			let variant = sameVariant || detail.variant;

			let instock = variant.getInstockByWarehouse(oldAdjustment.warehouse._id);

			let stock = stocks.find(stock => stock.product._id.toString() == detail.product._id.toString() && stock.variant._id.toString() == variant._id.toString() && stock.warehouse._id.toString() == oldAdjustment.warehouse._id.toString());

			let quantity = detail.instockBySubUnit;

			if (!stock) {
				stock = {
					product: { _id: detail.product._id, name: detail.product.name },
					variant: { _id: detail.variant._id, name: detail.variant.name },
					warehouse: { _id: oldAdjustment.warehouse._id, name: oldAdjustment.warehouse.name, instock: { before: instock, after: instock } },
					unit: { _id: detail.unit._id, name: detail.unit.name },
					quantity
				};

				stocks.push(stock);
			}

			if (detail.isAddition) {
				detail.variant.subtractFromStock({ warehouse: oldAdjustment.warehouse._id, quantity });
				stock.warehouse.after -= quantity;
			} else {
				detail.variant.addToStock({ warehouse: oldAdjustment.warehouse._id, quantity });
				stock.warehouse.after += quantity;
			}

			if (!sameVariant) variants.push(variant);
		}
	}

	let errors = [];

	if (variants.length > 0) {
		for (let stock of stocks) {
			if (stock.warehouse.instock.after < 0) {
				errors.push(stock);
			}
		}
	}

	if (errors.length > 0) throw createError({ type: "quantity", errors }, 422);

	oldAdjustment.fill(req.body).addDetails(adjustment.details).by(req.me._id);

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([oldAdjustment.save({ session }), ...variants.map((variant) => variant.save({ session }))]);

		await session.commitTransaction();

		res.json({ _id: oldAdjustment._id });
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.changeAdjustmentStatus = async (req, res) => {
	let adjustmentQuery = Adjustment.findById(req.params.id).populate("warehouse status details.product details.variant details.unit details.subUnit");

	let statusQuery = Status.findOne({ invoice: "adjustments", _id: req.body.statusId });

	let [adjustment, status] = await Promise.all([adjustmentQuery, statusQuery]);

	if (!adjustment) throw notFound();

	if (!status) throw notFound("status", 422);

	let variants = [];

	let errors = [];

	for (let detail of adjustment.details) {
		let sameVariant = variants.find((variant) => variant._id.toString() === detail.variant._id.toString());

		let variant = sameVariant || detail.variant;

		let instock = variant.getInstockByWarehouse(adjustment.warehouse._id);

		instock = { before: instock, after: instock };

		let quantity = detail.instockBySubUnit;

		if (adjustment.status.effected) {
			if (detail.isAddition) {
				variant.subtractFromStock({ warehouse: adjustment.warehouse._id, quantity });
				instock.after -= quantity;
			} else {
				variant.addToStock({ warehouse: adjustment.warehouse._id, quantity });
				instock.after += quantity;
			}
		}

		if (status.effected) {
			if (detail.isAddition) {
				variant.addToStock({ warehouse: adjustment.warehouse._id, quantity });
				instock.after += quantity;
			} else {
				variant.subtractFromStock({ warehouse: adjustment.warehouse._id, quantity });
				instock.after -= quantity;
			}
		}

		if (instock.after < 0) {
			errors.push({
				product: { _id: detail.product._id, name: detail.product.name },
				variant: { _id: variant._id, name: variant.name },
				warehouse: { _id: adjustment.warehouse._id, name: adjustment.warehouse.name, instock },
				unit: { _id: detail.unit._id, name: detail.unit.name },
				quantity
			});
			continue;
		}

		if (!sameVariant) variants.push(variant);
	}

	if (errors.length > 0) throw createError({ type: "quantity", errors }, 422);

	adjustment.status = status._id;

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([adjustment.save({ session }), ...variants.map((variant) => variant.save({ session }))]);

		await session.commitTransaction();

		res.json({});
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.deleteAdjustment = async (req, res) => {
	let adjustment = await Adjustment.findById(req.params.id, "status").populate("status", "effected");

	if (!adjustment) throw notFound();

	if (adjustment.status.effected) {
		throw createError("effected", 400);
	}

	await adjustment.deleteBy(req.me._id);;

	res.json({});
};
