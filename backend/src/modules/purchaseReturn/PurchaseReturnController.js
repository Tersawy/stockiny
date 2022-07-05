const mongoose = require("mongoose");

const { createError, notFound } = require("../../errors/ErrorHandler");

const PurchaseReturn = require("./PurchaseReturn");

const Status = require("../status/Status");

exports.getPurchasesReturn = async (req, res) => {
	let select = "date reference supplier warehouse status total paid paymentStatus";

	let filterOptions = { query: req.query, filterationFields: ["date", "supplier", "warehouse", "status"] };

	let paymentStatus = req.query.paymentStatus;

	let queries = { paid: "this.total === this.paid", unpaid: "this.paid === 0", partial: "this.paid < this.total && this.paid != 0" }

	paymentStatus = (Object.keys(queries).includes(paymentStatus) && { $where: queries[paymentStatus] } || {});

	let query = PurchaseReturn.find(paymentStatus, select)
		.withPagination(req.query)
		.withSearch(req.query)
		.withFilter(filterOptions)
		.populate("supplier warehouse", "name")
		.populate("status", "name color");

	let counts = PurchaseReturn.count().withSearch(req.query).withFilter(filterOptions);

	let [docs, total] = await Promise.all([query, counts]);

	docs.forEach((doc) => {
		doc._doc.paymentStatus = doc.paymentStatus;
	});

	res.json({ docs, total });
};

exports.createPurchaseReturn = async (req, res) => {
	let purchaseReturn = new PurchaseReturn().fill(req.body).addDetails(req.body.details).by(req.me._id);

	await purchaseReturn.populate("supplier warehouse status details.subUnit details.variant details.product");

	if (!purchaseReturn.supplier || purchaseReturn.supplier.deletedAt != null) throw notFound("supplier", 422);

	if (!purchaseReturn.warehouse || purchaseReturn.warehouse.deletedAt != null) throw notFound("warehouse", 422);

	if (!purchaseReturn.status || purchaseReturn.status.deletedAt != null) throw notFound("status", 422);

	let variants = [];

	let errors = [];

	for (let index in purchaseReturn.details) {
		let detail = purchaseReturn.details[index];

		if (!detail.subUnit || detail.subUnit.deletedAt != null) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		if (!detail.product || detail.product.deletedAt != null) throw createError({ field: `details[${index}].product`, type: "notFound" }, 422);

		if (!detail.variant || detail.variant.deletedAt != null) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		let isVariantRelatedWithProduct = detail.product.variants.includes(detail.variant._id.toString());

		if (!isVariantRelatedWithProduct) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		if (!detail.product.availableForPurchaseReturn) throw createError({ field: `details[${index}].product`, type: "notAvailable" }, 422);

		if (!detail.variant.availableForPurchaseReturn) throw createError({ field: `details[${index}].variant`, type: "notAvailable" }, 422);

		let subUnitIsMainUnit = detail.subUnit._id.toString() == detail.product.unit.toString();

		if (!subUnitIsMainUnit && detail.subUnit.base.toString() !== detail.product.unit.toString()) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		detail.unit = detail.product.unit;

		if (purchaseReturn.status.effected) {
			let instock = detail.variant.getInstockByWarehouse(purchaseReturn.warehouse._id);

			let quantity = detail.instockBySubUnit;

			if (instock < quantity) {
				errors.push({
					product: { _id: detail.product._id, name: detail.product.name },
					variant: { _id: detail.variant._id, name: detail.variant.name },
					warehouse: { _id: purchaseReturn.warehouse._id, name: purchaseReturn.warehouse.name, instock: { before: instock, after: instock - quantity } },
					unit: detail.unit,
					quantity
				});

				continue;
			}

			detail.variant.subtractFromStock({ warehouse: purchaseReturn.warehouse._id, quantity });

			variants.push(detail.variant);
		}
	}

	if (errors.length) throw createError({ type: "quantity", errors }, 422);

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([purchaseReturn.save({ session }), ...variants.map((variant) => variant.save({ session }))]);

		await session.commitTransaction();

		res.json({ _id: purchaseReturn._id });
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.getPurchaseReturn = async (req, res) => {
	let purchaseReturn = await PurchaseReturn.findById(req.params.id, "tax discount discountMethod shipping paid date details createdBy status supplier warehouse total reference createdAt")
		.populate("supplier", "name email phone zipCode address city country")
		.populate("warehouse", "name email phone zipCode address city country")
		.populate("details.subUnit", "name")
		.populate("details.product", "name code")
		.populate("details.variant", "name")
		.populate("status", "name color")
		.populate("createdBy", "fullname");

	if (!purchaseReturn) throw notFound();

	let details = purchaseReturn.details.map((detail) => {
		return {
			amount: detail.amount,
			quantity: detail.quantity,
			tax: detail.tax,
			taxMethod: detail.taxMethod,
			discount: detail.discount,
			discountMethod: detail.discountMethod,
			unit: detail.unit,
			variantId: detail.variant,
			total: detail.total,
			subUnit: detail.subUnit,
			product: detail.product._id,
			name: detail.product.name,
			code: detail.product.code,
			variantName: detail.variant.name
		};
	});

	res.json({ doc: { ...purchaseReturn.toJSON(), details } });
}

exports.getEditPurchaseReturn = async (req, res) => {
	let select = "date warehouse supplier shipping tax discount discountMethod status reference details notes";

	let purchaseReturn = await PurchaseReturn.findById(req.params.id, select).populate("details.product", "cost code name image").populate("details.variant", "name images stocks").populate("details.subUnit", "value operator");

	if (!purchaseReturn) throw notFound();

	let details = purchaseReturn.details.map(detail => {
		return {
			amount: detail.unitAmount,
			mainAmount: detail.product.cost, // mainAmount this becuase in update maybe the product that match this detail not found in productOptions and the reason is that the product has been deleted, disabled or don't have instock
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
			instock: detail.variant.getInstockByWarehouse(purchaseReturn.warehouse),
		};
	});

	res.json({ doc: { ...purchaseReturn.toJSON(), details } });
};

exports.updatePurchaseReturn = async (req, res) => {
	let oldPurchaseReturnQuery = PurchaseReturn.findById(req.params.id).populate("status warehouse details.variant details.product details.subUnit details.unit")

	let purchaseReturn = new PurchaseReturn().fill(req.body).addDetails(req.body.details);

	let [oldPurchaseReturn] = await Promise.all([oldPurchaseReturnQuery, purchaseReturn.populate("supplier status warehouse details.variant details.product details.subUnit")]);

	if (!oldPurchaseReturn) throw notFound();

	if (!purchaseReturn.supplier || purchaseReturn.supplier.deletedAt != null) throw notFound("supplier", 422);

	if (!purchaseReturn.warehouse || purchaseReturn.warehouse.deletedAt != null) throw notFound("warehouse", 422);

	if (!purchaseReturn.status || purchaseReturn.status.deletedAt != null) throw notFound("status", 422);

	let variants = [];

	let stocks = [];

	for (let index in purchaseReturn.details) {
		let detail = purchaseReturn.details[index];

		if (!detail.subUnit || detail.subUnit.deletedAt != null) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		if (!detail.product || detail.product.deletedAt != null) throw createError({ field: `details[${index}].product`, type: "notFound" }, 422);

		if (!detail.variant || detail.variant.deletedAt != null) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		let isVariantRelatedWithProduct = detail.product.variants.includes(detail.variant._id.toString());

		if (!isVariantRelatedWithProduct) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		if (!detail.product.availableForPurchaseReturn) throw createError({ field: `details[${index}].product`, type: "notAvailable" }, 422);

		if (!detail.variant.availableForPurchaseReturn) throw createError({ field: `details[${index}].variant`, type: "notAvailable" }, 422);

		let subUnitIsMainUnit = detail.subUnit._id.toString() == detail.product.unit.toString();

		if (!subUnitIsMainUnit && detail.subUnit.base.toString() !== detail.product.unit.toString()) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		detail.unit = detail.product.unit;

		if (purchaseReturn.status.effected) {

			let instock = detail.variant.getInstockByWarehouse(purchaseReturn.warehouse._id);

			let quantity = detail.instockBySubUnit;

			stocks.push({
				product: { _id: detail.product._id, name: detail.product.name },
				variant: { _id: detail.variant._id, name: detail.variant.name },
				warehouse: { _id: purchaseReturn.warehouse._id, name: purchaseReturn.warehouse.name, instock: { before: instock, after: instock - quantity } },
				unit: detail.unit,
				quantity
			})

			detail.variant.subtractFromStock({ warehouse: purchaseReturn.warehouse._id, quantity });

			variants.push(detail.variant);
		}
	}

	if (oldPurchaseReturn.status.effected) {
		for (let index in oldPurchaseReturn.details) {
			let detail = oldPurchaseReturn.details[index];

			let sameVariant = variants.find(variant => variant._id.toString() == detail.variant._id.toString());

			let variant = sameVariant || detail.variant;

			let instock = variant.getInstockByWarehouse(oldPurchaseReturn.warehouse._id);

			let stock = stocks.find(stock => stock.product._id.toString() == detail.product._id.toString() && stock.variant._id.toString() == variant._id.toString() && stock.warehouse._id.toString() == oldPurchaseReturn.warehouse._id.toString());

			let quantity = detail.instockBySubUnit;

			if (!stock) {
				stock = {
					product: { _id: detail.product._id, name: detail.product.name },
					variant: { _id: detail.variant._id, name: detail.variant.name },
					warehouse: { _id: oldPurchaseReturn.warehouse._id, name: oldPurchaseReturn.warehouse.name, instock: { before: instock, after: instock + quantity } },
					unit: { _id: detail.unit._id, name: detail.unit.name },
					quantity
				};

				stocks.push(stock)
			}

			variant.addToStock({ warehouse: oldPurchaseReturn.warehouse._id, quantity });

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

	oldPurchaseReturn.fill(req.body).addDetails(purchaseReturn.details).by(req.me._id);

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([oldPurchaseReturn.save({ session }), ...variants.map((variant) => variant.save({ session }))]);

		await session.commitTransaction();

		res.json({ _id: oldPurchaseReturn._id });
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.changePurchaseReturnStatus = async (req, res) => {
	let purchaseReturnQuery = PurchaseReturn.findById(req.params.id).populate("warehouse status details.product details.variant details.unit details.subUnit");

	let statusQuery = Status.findOne({ invoice: "purchasesReturn", _id: req.body.statusId });

	let [purchaseReturn, status] = await Promise.all([purchaseReturnQuery, statusQuery]);

	if (!purchaseReturn) throw notFound();

	if (!status) throw notFound("status", 422);

	let variants = [];

	let errors = [];

	for (let detail of purchaseReturn.details) {
		let sameVariant = variants.find((variant) => variant._id.toString() === detail.variant._id.toString());

		let variant = sameVariant || detail.variant;

		let instock = variant.getInstockByWarehouse(purchaseReturn.warehouse._id);

		instock = { before: instock, after: instock };

		let quantity = detail.instockBySubUnit;

		if (purchaseReturn.status && purchaseReturn.status.effected) {
			variant.addToStock({ warehouse: purchaseReturn.warehouse._id, quantity });
			instock.after += quantity;
		}

		if (status.effected) {
			variant.subtractFromStock({ warehouse: purchaseReturn.warehouse._id, quantity });
			instock.after -= quantity;
		}

		if (instock.after < 0) {
			errors.push({
				product: { _id: detail.product._id, name: detail.product.name },
				variant: { _id: variant._id, name: variant.name },
				warehouse: { _id: purchaseReturn.warehouse._id, name: purchaseReturn.warehouse.name, instock },
				unit: { _id: detail.unit._id, name: detail.unit.name },
				quantity
			});
			continue;
		}

		if (!sameVariant) variants.push(variant);
	}

	if (errors.length > 0) throw createError({ type: "quantity", errors }, 422);

	purchaseReturn.status = status._id;

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([purchaseReturn.save({ session }), ...variants.map((variant) => variant.save({ session }))]);

		await session.commitTransaction();

		res.json({});
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.deletePurchaseReturn = async (req, res) => {
	let purchaseReturn = await PurchaseReturn.findById(req.params.id, "paid status").populate("status", "effected");

	if (!purchaseReturn) throw notFound();

	if (purchaseReturn.paid) throw createError("paid", 400);

	if (purchaseReturn.status && purchaseReturn.status.effected) {
		throw createError("effected", 400);
	}

	await purchaseReturn.deleteBy(req.me._id);;

	res.json({});
};

exports.getPayments = async (req, res) => {
	let purchaseReturn = await PurchaseReturn.findById(req.params.id, "payments");

	if (!purchaseReturn) throw notFound();

	res.json({ payments: purchaseReturn.payments });
};

exports.createPayment = async (req, res) => {
	let purchaseReturn = await PurchaseReturn.findById(req.params.id);

	if (!purchaseReturn) throw notFound();

	purchaseReturn.addPayment({ ...req.body, createdBy: req.me._id });

	await purchaseReturn.save();

	res.json({});
}

exports.updatePayment = async (req, res) => {
	let purchaseReturn = await PurchaseReturn.findById(req.params.id);

	if (!purchaseReturn) throw notFound();

	purchaseReturn.editPayment(req.params.paymentId, { ...req.body, updatedBy: req.me._id });

	await purchaseReturn.save();

	res.json({});
}

exports.deletePayment = async (req, res) => {
	let purchaseReturn = await PurchaseReturn.findById(req.params.id);

	if (!purchaseReturn) throw notFound();

	purchaseReturn.deletePayment(req.params.paymentId);

	await purchaseReturn.save();

	res.json({});
}
