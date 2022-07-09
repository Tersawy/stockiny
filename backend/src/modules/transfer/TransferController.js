const mongoose = require("mongoose");

const { createError, notFound } = require("../../errors/ErrorHandler");

const Transfer = require("./Transfer");

const Status = require("../status/Status");

exports.getTransfers = async (req, res) => {
	let select = "date reference fromWarehouse toWarehouse status total";

	let filterOptions = { query: req.query, filterationFields: ["date", "fromWarehouse", "toWarehouse", "status"] };

	let query = Transfer.find({}, select)
		.withPagination(req.query)
		.withSearch(req.query)
		.withFilter(filterOptions)
		.populate("fromWarehouse toWarehouse", "name")
		.populate("status", "name color");

	let counts = Transfer.count().withSearch(req.query).withFilter(filterOptions);

	let [docs, total] = await Promise.all([query, counts]);

	res.json({ docs, total });
};

exports.createTransfer = async (req, res) => {
	if (req.body.fromWarehouse === req.body.toWarehouse) throw createError("warehouse", 400);

	let transfer = new Transfer().fill(req.body).addDetails(req.body.details).by(req.me._id);

	await transfer.populate("fromWarehouse toWarehouse status details.product details.variant details.subUnit");

	if (!transfer.fromWarehouse || transfer.fromWarehouse.deletedAt != null) throw createError({ field: "fromWarehouse", type: "notFound" }, 422);

	if (!transfer.toWarehouse || transfer.toWarehouse.deletedAt != null) throw createError({ field: "toWarehouse", type: "notFound" }, 422);

	if (!transfer.status || transfer.status.deletedAt != null) throw createError({ field: "status", type: "notFound" }, 422);

	let variants = [];

	let errors = [];

	for (let index in transfer.details) {
		let detail = transfer.details[index];

		if (!detail.subUnit || detail.subUnit.deletedAt != null) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		if (!detail.product || detail.product.deletedAt != null) throw createError({ field: `details[${index}].product`, type: "notFound" }, 422);

		if (!detail.variant || detail.variant.deletedAt != null) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		let isVariantRelatedWithProduct = detail.product.variants.includes(detail.variant._id.toString());

		if (!isVariantRelatedWithProduct) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		let subUnitIsMainUnit = detail.subUnit._id.toString() == detail.product.unit.toString();

		if (!subUnitIsMainUnit && detail.subUnit.base.toString() !== detail.product.unit.toString()) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		detail.unit = detail.product.unit;

		if (transfer.status.effected) {
			let instockFrom = detail.variant.getInstockByWarehouse(transfer.fromWarehouse._id),
				instockTo = detail.variant.getInstockByWarehouse(transfer.toWarehouse._id);

			instockFrom = { before: instockFrom, after: instockFrom };

			instockTo = { before: instockTo, after: instockTo };

			let quantity = detail.instockBySubUnit;

			if (instockFrom < quantity) {
				errors.push({
					product: { _id: detail.product._id, name: detail.product.name },
					variant: { _id: detail.variant._id, name: detail.variant.name },
					fromWarehouse: { _id: transfer.fromWarehouse._id, name: transfer.fromWarehouse.name, instock: { before: instockFrom, after: instockFrom - quantity } },
					toWarehouse: { _id: transfer.toWarehouse._id, name: transfer.toWarehouse.name, instock: { before: instockFrom, after: instockFrom + quantity } },
					unit: detail.product.unit,
					quantity
				});
				continue;
			}

			detail.variant.addToStock({ warehouse: transfer.toWarehouse._id, quantity });

			detail.variant.subtractFromStock({ warehouse: transfer.fromWarehouse._id, quantity });

			variants.push(detail.variant);
		}
	}

	if (errors.length) throw createError({ type: "quantity", errors }, 422);

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([transfer.save({ session }), ...variants.map((variant) => variant.save({ session }))]);

		await session.commitTransaction();

		res.json({ _id: transfer._id });
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.getTransfer = async (req, res) => {
	let transfer = await Transfer.findById(req.params.id, "tax discount discountMethod shipping paid date details createdBy status fromWarehouse toWarehouse total reference createdAt")
		.populate("fromWarehouse toWarehouse", "name email phone zipCode address city country")
		.populate("details.subUnit", "name")
		.populate("details.product", "name code")
		.populate("details.variant", "name")
		.populate("status", "name color")
		.populate("createdBy", "fullname");

	if (!transfer) throw notFound();

	let details = transfer.details.map((detail) => ({
		amount: detail.amount,
		quantity: detail.quantity,
		tax: detail.tax,
		taxMethod: detail.taxMethod,
		discount: detail.discount,
		discountMethod: detail.discountMethod,
		unit: detail.unit,
		variantId: detail.variant._id,
		total: detail.total,
		subUnit: detail.subUnit,
		product: detail.product._id,
		name: detail.product.name,
		code: detail.product.code,
		variantName: detail.variant.name
	}));

	res.json({ doc: { ...transfer.toJSON(), details } });
}

exports.getEditTransfer = async (req, res) => {
	let select = "date fromWarehouse toWarehouse shipping tax discount discountMethod status reference details notes";

	let transfer = await Transfer.findById(req.params.id, select).populate("details.product", "cost code name image").populate("details.variant", "name images stocks").populate("details.subUnit", "value operator");

	if (!transfer) throw notFound();

	let details = transfer.details.map(detail => ({
		amount: detail.unitAmount,
		mainAmount: detail.product.cost,
		quantity: detail.quantity,
		tax: detail.tax,
		taxMethod: detail.taxMethod,
		discount: detail.discount,
		discountMethod: detail.discountMethod,
		unit: detail.unit,
		subUnit: detail.subUnit._id,
		variantId: detail.variant._id,
		product: detail.product._id,
		name: detail.product.name,
		code: detail.product.code,
		variantName: detail.variant.name,
		image: detail.variant.defaultImage || detail.product.image,
		instock: detail.variant.getInstockByWarehouse(transfer.fromWarehouse)
	}));

	res.json({ doc: { ...transfer.toJSON(), details } });
};

exports.updateTransfer = async (req, res) => {
	if (req.body.fromWarehouse === req.body.toWarehouse) throw createError("warehouse", 400);

	let oldTransferQuery = Transfer.findById(req.params.id).populate("fromWarehouse toWarehouse status details.variant details.product details.subUnit details.unit");

	let transfer = new Transfer().fill(req.body).addDetails(req.body.details);

	let [oldTransfer] = await Promise.all([oldTransferQuery, transfer.populate("fromWarehouse toWarehouse status details.variant details.product details.subUnit")]);

	if (!oldTransfer) throw notFound();

	if (!transfer.fromWarehouse || transfer.fromWarehouse.deletedAt != null) throw createError({ field: "fromWarehouse", type: "notFound" }, 422);

	if (!transfer.toWarehouse || transfer.toWarehouse.deletedAt != null) throw createError({ field: "toWarehouse", type: "notFound" }, 422);

	if (!transfer.status || transfer.status.deletedAt != null) throw createError({ field: "status", type: "notFound" }, 422);

	let variants = [];

	let stocks = [];

	for (let index in transfer.details) {
		let detail = transfer.details[index];

		if (!detail.subUnit || detail.subUnit.deletedAt != null) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		if (!detail.product || detail.product.deletedAt != null) throw createError({ field: `details[${index}].product`, type: "notFound" }, 422);

		if (!detail.variant || detail.variant.deletedAt != null) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		let isVariantRelatedWithProduct = detail.product.variants.includes(detail.variant._id.toString());

		if (!isVariantRelatedWithProduct) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		let subUnitIsMainUnit = detail.subUnit._id.toString() == detail.product.unit.toString();

		if (!subUnitIsMainUnit && detail.subUnit.base.toString() !== detail.product.unit.toString()) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		detail.unit = detail.product.unit;

		if (transfer.status.effected) {
			let instockFrom = detail.variant.getInstockByWarehouse(transfer.fromWarehouse._id),
				instockTo = detail.variant.getInstockByWarehouse(transfer.toWarehouse._id);

			instockFrom = { before: instockFrom, after: instockFrom };

			instockTo = { before: instockTo, after: instockTo };

			let quantity = detail.instockBySubUnit;

			stocks.push({
				product: { _id: detail.product._id, name: detail.product.name },
				variant: { _id: detail.variant._id, name: detail.variant.name },
				fromWarehouse: { _id: transfer.fromWarehouse._id, name: transfer.fromWarehouse.name, instock: { before: instockFrom, after: instockFrom - quantity } },
				toWarehouse: { _id: transfer.toWarehouse._id, name: transfer.toWarehouse.name, instock: { before: instockTo, after: instockTo + quantity } },
				unit: detail.unit,
				quantity
			})

			variant.addToStock({ warehouse: transfer.toWarehouse._id, quantity });

			variant.subtractFromStock({ warehouse: transfer.fromWarehouse._id, quantity });

			variants.push(detail.variant);
		}
	}

	if (oldTransfer.status.effected) {
		for (let index in oldTransfer.details) {
			let detail = oldTransfer.details[index];

			let sameVariant = variants.find(variant => variant._id.toString() == detail.variant._id.toString());

			let variant = sameVariant || detail.variant;

			let instockFrom = detail.variant.getInstockByWarehouse(oldTransfer.fromWarehouse._id),
				instockTo = detail.variant.getInstockByWarehouse(oldTransfer.toWarehouse._id);

			instockFrom = { before: instockFrom, after: instockFrom };

			instockTo = { before: instockTo, after: instockTo };

			let stock = stocks.find(stock => stock.product._id.toString() == detail.product._id.toString() && stock.variant._id.toString() == variant._id.toString());

			let quantity = detail.instockBySubUnit;

			if (!stock) {
				stock = {
					product: { _id: detail.product._id, name: detail.product.name },
					variant: { _id: detail.variant._id, name: detail.variant.name },
					fromWarehouse: { _id: oldTransfer.fromWarehouse._id, name: oldTransfer.fromWarehouse.name, instock: instockFrom },
					toWarehouse: { _id: oldTransfer.toWarehouse._id, name: oldTransfer.toWarehouse.name, instock: instockTo },
					unit: { _id: detail.unit._id, name: detail.unit.name },
					quantity
				};

				stocks.push(stock);
			}

			if (oldTransfer.fromWarehouse._id.toString() === stock.fromWarehouse._id.toString()) {
				stock.fromWarehouse.instock.after -= quantity;
			} else if (oldTransfer.fromWarehouse._id.toString() === stock.toWarehouse._id.toString()) {
				stock.toWarehouse.instock.after -= quantity;
			}

			if (oldTransfer.toWarehouse._id.toString() === stock.toWarehouse._id.toString()) {
				stock.toWarehouse.instock.after -= quantity;
			} else if (oldTransfer.toWarehouse._id.toString() === stock.fromWarehouse._id.toString()) {
				stock.fromWarehouse.instock.after -= quantity;
			}

			variant.subtractFromStock({ warehouse: oldTransfer.toWarehouse._id, quantity });

			variant.addToStock({ warehouse: oldTransfer.fromWarehouse._id, quantity });

			if (!sameVariant) variants.push(variant);
		}
	}

	let errors = [];

	if (variants.length > 0) {
		for (let stock of stocks) {
			if (stock.fromWarehouse.instock.after < 0 || stock.toWarehouse.instock.after < 0) {
				errors.push(stock);
			}
		}
	}

	if (errors.length) throw createError({ type: "quantity", errors }, 422);

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([oldTransfer.save({ session }), ...variants.map((variant) => variant.save({ session }))]);

		await session.commitTransaction();

		res.json({ _id: oldTransfer._id });
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.changeTransferStatus = async (req, res) => {
	let transferQuery = Transfer.findById(req.params.id).populate("toWarehouse fromWarehouse status details.product details.variant details.unit details.subUnit");

	let statusQuery = Status.findOne({ _id: req.body.statusId, invoice: "transfers" });

	let [transfer, status] = await Promise.all([transferQuery, statusQuery]);

	if (!transfer) throw notFound();

	if (!status) throw notFound("status", 422);

	let variants = [];

	let errors = [];

	for (let detail of transfer.details) {
		let sameVariant = variants.find((variant) => variant._id.toString() === detail.variant._id.toString());

		let variant = sameVariant || detail.variant;

		let instockFrom = variant.getInstockByWarehouse(transfer.fromWarehouse._id);

		instockFrom = { before: instockFrom, after: instockFrom };

		let instockTo = variant.getInstockByWarehouse(transfer.toWarehouse._id);

		instockTo = { before: instockTo, after: instockTo };

		let quantity = detail.instockBySubUnit;

		if (transfer.status.effected) {
			variant.addToStock({ warehouse: transfer.fromWarehouse._id, quantity });

			variant.subtractFromStock({ warehouse: transfer.toWarehouse._id, quantity });

			instockFrom.after += quantity;

			instockTo.after -= quantity;
		}

		if (status.effected) {
			variant.subtractFromStock({ warehouse: transfer.fromWarehouse._id, quantity });

			variant.addToStock({ warehouse: transfer.toWarehouse._id, quantity });

			instockFrom.after -= quantity;

			instockTo.after += quantity;
		}

		if (instockTo.after < 0 || instockFrom.after < 0) {
			errors.push({
				product: { _id: detail.product._id, name: detail.product.name },
				variant: { _id: variant._id, name: variant.name },
				fromWarehouse: { _id: transfer.fromWarehouse._id, name: transfer.fromWarehouse.name, instock: instockFrom },
				toWarehouse: { _id: transfer.toWarehouse._id, name: transfer.toWarehouse.name, instock: instockTo },
				unit: { _id: detail.unit._id, name: detail.unit.name },
				quantity
			});
			continue;
		}

		if (!sameVariant) variants.push(variant);
	}

	if (errors.length > 0) throw createError({ type: "quantity", errors }, 422);

	transfer.status = status._id;

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([transfer.save({ session }), ...variants.map((variant) => variant.save({ session }))]);

		await session.commitTransaction();

		res.json({});
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.deleteTransfer = async (req, res) => {
	let transfer = await Transfer.findById(req.params.id, "status").populate("status", "effected");

	if (!transfer) throw notFound();

	if (transfer.status && transfer.status.effected) {
		throw createError("effected", 400);
	}

	await transfer.deleteBy(req.me._id);;

	res.json({});
};
