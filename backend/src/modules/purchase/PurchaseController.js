const mongoose = require("mongoose");

const { createError, notFound } = require("../../errors/ErrorHandler");

const Purchase = require("./Purchase");

const Status = require("../status/Status");

exports.getPurchases = async (req, res) => {
	let select = "date reference supplier warehouse status total paid paymentStatus";

	let filterOptions = { query: req.query, filterationFields: ["date", "supplier", "warehouse", "status"] };

	let paymentStatus = req.query.paymentStatus;

	let queries = { paid: "this.total === this.paid", unpaid: "this.paid === 0", partial: "this.paid < this.total && this.paid != 0" }

	paymentStatus = (Object.keys(queries).includes(paymentStatus) && { $where: queries[paymentStatus] } || {});

	let query = Purchase.find(paymentStatus, select)
		.withPagination(req.query)
		.withSearch(req.query)
		.withFilter(filterOptions)
		.populate("supplier warehouse", "name")
		.populate("status", "name color");

	let counts = Purchase.count().withSearch(req.query).withFilter(filterOptions);

	let [docs, total] = await Promise.all([query, counts]);

	docs.forEach((doc) => {
		doc._doc.paymentStatus = doc.paymentStatus;
	});

	res.json({ docs, total });
};

exports.createPurchase = async (req, res) => {
	let purchase = new Purchase().fill(req.body).addDetails(req.body.details).by(req.me._id);

	await purchase.populate("supplier warehouse status details.product details.variant details.subUnit");

	if (!purchase.supplier || purchase.supplier.deletedAt != null) throw notFound("supplier", 422);

	if (!purchase.warehouse || purchase.warehouse.deletedAt != null) throw notFound("warehouse", 422);

	if (!purchase.status || purchase.status.deletedAt != null) throw notFound("status", 422);

	let variants = [];

	for (let index in purchase.details) {
		let detail = purchase.details[index];

		if (!detail.subUnit || detail.subUnit.deletedAt != null) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		if (!detail.product || detail.product.deletedAt != null) throw createError({ field: `details[${index}].product`, type: "notFound" }, 422);

		if (!detail.variant || detail.variant.deletedAt != null) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		let isVariantRelatedWithProduct = detail.product.variants.includes(detail.variant._id.toString());

		if (!isVariantRelatedWithProduct) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		if (!detail.product.availableForPurchase) throw createError({ field: `details[${index}].product`, type: "notAvailable" }, 422);

		if (!detail.variant.availableForPurchase) throw createError({ field: `details[${index}].variant`, type: "notAvailable" }, 422);

		let subUnitIsMainUnit = detail.subUnit._id.toString() == detail.product.unit.toString();

		if (!subUnitIsMainUnit && detail.subUnit.base.toString() !== detail.product.unit.toString()) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		detail.unit = detail.product.unit;

		if (purchase.status.effected) {
			detail.variant.addToStock({ warehouse: purchase.warehouse._id, quantity: detail.instockBySubUnit });
			variants.push(detail.variant);
		}
	}

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([purchase.save({ session }), ...variants.map((variant) => variant.save({ session }))]);

		await session.commitTransaction();

		res.json({ _id: purchase._id });
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.getPurchase = async (req, res) => {
	let purchase = await Purchase.findById(req.params.id, "tax discount discountMethod shipping paid date details createdBy status supplier warehouse total reference createdAt")
		.populate("supplier", "name email phone zipCode address city country")
		.populate("warehouse", "name email phone zipCode address city country")
		.populate("details.subUnit", "name")
		.populate("details.product", "name code")
		.populate("details.variant", "name")
		.populate("status", "name color")
		.populate("createdBy", "fullname");

	if (!purchase) throw notFound();

	let details = purchase.details.map((detail) => ({
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

	res.json({ doc: { ...purchase.toJSON(), details } });
}

exports.getEditPurchase = async (req, res) => {
	let select = "date warehouse supplier shipping tax discount discountMethod status reference details notes";

	let purchase = await Purchase.findById(req.params.id, select).populate("details.product", "cost code name image").populate("details.variant", "name images stocks").populate("details.subUnit", "value operator");

	if (!purchase) throw notFound();

	let details = purchase.details.map(detail => ({
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
		instock: detail.variant.getInstockByWarehouse(purchase.warehouse)
	}));

	res.json({ doc: { ...purchase.toJSON(), details } });
};

exports.updatePurchase = async (req, res) => {
	let oldPurchaseQuery = Purchase.findById(req.params.id).populate("status warehouse details.variant details.product details.subUnit details.unit");

	let purchase = new Purchase().fill(req.body).addDetails(req.body.details);

	let [oldPurchase] = await Promise.all([oldPurchaseQuery, purchase.populate("supplier status warehouse details.variant details.product details.subUnit")]);

	if (!oldPurchase) throw notFound();

	if (!purchase.supplier || purchase.supplier.deletedAt != null) throw notFound("supplier", 422);

	if (!purchase.warehouse || purchase.warehouse.deletedAt != null) throw notFound("warehouse", 422);

	if (!purchase.status || purchase.status.deletedAt != null) throw notFound("status", 422);

	let variants = [];

	let stocks = [];

	for (let index in purchase.details) {
		let detail = purchase.details[index];

		if (!detail.subUnit || detail.subUnit.deletedAt != null) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		if (!detail.product || detail.product.deletedAt != null) throw createError({ field: `details[${index}].product`, type: "notFound" }, 422);

		if (!detail.variant || detail.variant.deletedAt != null) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		let isVariantRelatedWithProduct = detail.product.variants.includes(detail.variant._id.toString());

		if (!isVariantRelatedWithProduct) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		if (!detail.product.availableForPurchase) throw createError({ field: `details[${index}].product`, type: "notAvailable" }, 422);

		if (!detail.variant.availableForPurchase) throw createError({ field: `details[${index}].variant`, type: "notAvailable" }, 422);

		let subUnitIsMainUnit = detail.subUnit._id.toString() == detail.product.unit.toString();

		if (!subUnitIsMainUnit && detail.subUnit.base.toString() !== detail.product.unit.toString()) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		detail.unit = detail.product.unit;

		if (purchase.status.effected) {
			let instock = detail.variant.getInstockByWarehouse(purchase.warehouse._id);

			let quantity = detail.instockBySubUnit;

			stocks.push({
				product: { _id: detail.product._id, name: detail.product.name },
				variant: { _id: detail.variant._id, name: detail.variant.name },
				warehouse: { _id: purchase.warehouse._id, name: purchase.warehouse.name, instock: { before: instock, after: quantity + instock } },
				unit: detail.unit,
				quantity
			})

			detail.variant.addToStock({ warehouse: purchase.warehouse._id, quantity });

			variants.push(detail.variant);
		}
	}

	if (oldPurchase.status.effected) {
		for (let index in oldPurchase.details) {
			let detail = oldPurchase.details[index];

			let sameVariant = variants.find(variant => variant._id.toString() == detail.variant._id.toString());

			let variant = sameVariant || detail.variant;

			let instock = variant.getInstockByWarehouse(oldPurchase.warehouse._id);

			let stock = stocks.find(stock => stock.product._id.toString() == detail.product._id.toString() && stock.variant._id.toString() == variant._id.toString() && stock.warehouse._id.toString() == oldPurchase.warehouse._id.toString());

			let quantity = detail.instockBySubUnit;

			if (!stock) {
				stock = {
					product: { _id: detail.product._id, name: detail.product.name },
					variant: { _id: detail.variant._id, name: detail.variant.name },
					warehouse: { _id: oldPurchase.warehouse._id, name: oldPurchase.warehouse.name, instock: { before: instock, after: instock } },
					unit: { _id: detail.unit._id, name: detail.unit.name },
					quantity
				};

				stocks.push(stock)
			}

			stock.warehouse.instock.after -= quantity;

			variant.subtractFromStock({ warehouse: oldPurchase.warehouse._id, quantity });

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

	oldPurchase.fill(req.body).addDetails(purchase.details).by(req.me._id);

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([oldPurchase.save({ session }), ...variants.map((variant) => variant.save({ session }))]);

		await session.commitTransaction();

		res.json({ _id: oldPurchase._id });
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.changePurchaseStatus = async (req, res) => {
	let purchaseQuery = Purchase.findById(req.params.id).populate("warehouse status details.product details.variant details.unit details.subUnit");

	let statusQuery = Status.findOne({ invoice: "purchases", _id: req.body.statusId });

	let [purchase, status] = await Promise.all([purchaseQuery, statusQuery]);

	if (!purchase) throw notFound();

	if (!status) throw notFound("status", 422);

	let variants = [];

	let errors = [];

	for (let detail of purchase.details) {
		let sameVariant = variants.find((variant) => variant._id.toString() === detail.variant._id.toString());

		let variant = sameVariant || detail.variant;

		let instock = variant.getInstockByWarehouse(purchase.warehouse._id);

		instock = { before: instock, after: instock };

		let quantity = detail.instockBySubUnit;

		if (purchase.status && purchase.status.effected) {
			variant.subtractFromStock({ warehouse: purchase.warehouse._id, quantity });
			instock.after -= quantity;
		}

		if (status.effected) {
			variant.addToStock({ warehouse: purchase.warehouse._id, quantity });
			instock.after += quantity;
		}

		if (instock.after < 0) {
			errors.push({
				product: { _id: detail.product._id, name: detail.product.name },
				variant: { _id: variant._id, name: variant.name },
				warehouse: { _id: purchase.warehouse._id, name: purchase.warehouse.name, instock },
				unit: { _id: detail.unit._id, name: detail.unit.name },
				quantity
			});
			continue;
		}

		if (!sameVariant) variants.push(variant);
	}

	if (errors.length > 0) throw createError({ type: "quantity", errors }, 422);

	purchase.status = status._id;

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([purchase.save({ session }), ...variants.map((p) => p.save({ session }))]);

		await session.commitTransaction();

		res.json({});
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.deletePurchase = async (req, res) => {
	let purchase = await Purchase.findById(req.params.id, "paid status").populate("status", "effected");

	if (!purchase) throw notFound();

	if (purchase.paid) throw createError("paid", 400);

	if (purchase.status && purchase.status.effected) {
		throw createError("effected", 400);
	}

	await purchase.deleteBy(req.me._id);;

	res.json({});
};

exports.getPayments = async (req, res) => {
	let purchase = await Purchase.findById(req.params.id, "payments");

	if (!purchase) throw notFound();

	res.json({ payments: purchase.payments });
};

exports.createPayment = async (req, res) => {
	let purchase = await Purchase.findById(req.params.id);

	if (!purchase) throw notFound();

	purchase.addPayment({ ...req.body, createdBy: req.me._id });

	await purchase.save();

	res.json({});
}

exports.updatePayment = async (req, res) => {
	let purchase = await Purchase.findById(req.params.id);

	if (!purchase) throw notFound();

	purchase.editPayment(req.params.paymentId, { ...req.body, updatedBy: req.me._id });

	await purchase.save();

	res.json({});
}

exports.deletePayment = async (req, res) => {
	let purchase = await Purchase.findById(req.params.id);

	if (!purchase) throw notFound();

	purchase.deletePayment(req.params.paymentId);

	await purchase.save();

	res.json({});
}
