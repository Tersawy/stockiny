const mongoose = require("mongoose");

const { createError, notFound } = require("../../errors/ErrorHandler");

const SaleReturn = require("./SaleReturn");

const Status = require("../status/Status");

exports.getSalesReturn = async (req, res) => {
	let select = "date reference customer warehouse status total paid paymentStatus";

	let filterOptions = { query: req.query, filterationFields: ["date", "customer", "warehouse", "status"] };

	let paymentStatus = req.query.paymentStatus;

	let queries = { paid: "this.total === this.paid", unpaid: "this.paid === 0", partial: "this.paid < this.total && this.paid != 0" }

	paymentStatus = (Object.keys(queries).includes(paymentStatus) && { $where: queries[paymentStatus] } || {});

	let query = SaleReturn.find(paymentStatus, select)
		.withPagination(req.query)
		.withSearch(req.query)
		.withFilter(filterOptions)
		.populate("customer warehouse", "name")
		.populate("status", "name color");

	let counts = SaleReturn.count().withSearch(req.query).withFilter(filterOptions);

	let [docs, total] = await Promise.all([query, counts]);

	docs.forEach((doc) => {
		doc._doc.paymentStatus = doc.paymentStatus;
	});

	res.json({ docs, total });
};

exports.createSaleReturn = async (req, res) => {
	let saleReturn = new SaleReturn().fill(req.body).addDetails(req.body.details).by(req.me._id);

	await saleReturn.populate("customer warehouse status details.subUnit details.variant details.product");

	if (!saleReturn.customer || saleReturn.customer.deletedAt != null) throw notFound("customer", 422);

	if (!saleReturn.warehouse || saleReturn.warehouse.deletedAt != null) throw notFound("warehouse", 422);

	if (!saleReturn.status || saleReturn.status.deletedAt != null) throw notFound("status", 422);

	let variants = [];

	for (let index in saleReturn.details) {
		let detail = saleReturn.details[index];

		if (!detail.subUnit || detail.subUnit.deletedAt != null) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		if (!detail.product || detail.product.deletedAt != null) throw createError({ field: `details[${index}].product`, type: "notFound" }, 422);

		if (!detail.variant || detail.variant.deletedAt != null) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		let isVariantRelatedWithProduct = detail.product.variants.includes(detail.variant._id.toString());

		if (!isVariantRelatedWithProduct) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		if (!detail.product.availableForSaleReturn) throw createError({ field: `details[${index}].product`, type: "notAvailable" }, 422);

		if (!detail.variant.availableForSaleReturn) throw createError({ field: `details[${index}].variant`, type: "notAvailable" }, 422);

		let subUnitIsMainUnit = detail.subUnit._id.toString() == detail.product.unit.toString();

		if (!subUnitIsMainUnit && detail.subUnit.base.toString() !== detail.product.unit.toString()) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		detail.unit = detail.product.unit;

		if (saleReturn.status.effected) {
			detail.variant.addToStock({ warehouse: saleReturn.warehouse._id, quantity: detail.instockBySubUnit });
			variants.push(detail.variant);
		}
	}

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([saleReturn.save({ session }), ...variants.map((variant) => variant.save({ session }))]);

		await session.commitTransaction();

		res.json({ _id: saleReturn._id });
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.getSaleReturn = async (req, res) => {
	let saleReturn = await SaleReturn.findById(req.params.id, "tax discount discountMethod shipping paid date details createdBy status customer warehouse total reference createdAt")
		.populate("customer", "name email phone zipCode address city country")
		.populate("warehouse", "name email phone zipCode address city country")
		.populate("details.subUnit", "name")
		.populate("details.product", "name code")
		.populate("details.variant", "name")
		.populate("status", "name color")
		.populate("createdBy", "fullname");

	if (!saleReturn) throw notFound();

	let details = saleReturn.details.map((detail) => {
		return {
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
		};
	});

	res.json({ doc: { ...saleReturn.toJSON(), details } });
}

exports.getEditSaleReturn = async (req, res) => {
	let select = "date warehouse customer shipping tax discount discountMethod status reference details notes";

	let saleReturn = await SaleReturn.findById(req.params.id, select).populate("details.product", "price code name image").populate("details.product", "name images stocks").populate("details.subUnit", "value operator");

	if (!saleReturn) throw notFound();

	let details = saleReturn.details.map(detail => {
		return {
			amount: detail.unitAmount,
			mainAmount: detail.product.price, // mainAmount this becuase in update maybe the product that match this detail not found in productOptions and the reason is that the product has been deleted, disabled or don't have instock
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
			instock: detail.variant.getInstockByWarehouse(saleReturn.warehouse),
		};
	});

	res.json({ doc: { ...saleReturn.toJSON(), details } });
};

exports.updateSaleReturn = async (req, res) => {
	let oldSaleReturnQuery = SaleReturn.findById(req.params.id).populate("status warehouse details.variant details.product details.subUnit details.unit");

	let saleReturn = new Purchase().fill(req.body).addDetails(req.body.details);

	let [oldSaleReturn] = await Promise.all([oldSaleReturnQuery, saleReturn.populate("customer status warehouse details.variant details.product details.subUnit")]);

	if (!oldSaleReturn) throw notFound();

	if (!saleReturn.customer || saleReturn.customer.deletedAt != null) throw notFound("customer", 422);

	if (!saleReturn.warehouse || saleReturn.warehouse.deletedAt != null) throw notFound("warehouse", 422);

	if (!saleReturn.status || saleReturn.status.deletedAt != null) throw notFound("status", 422);

	let variants = [];

	let stocks = [];

	for (let index in saleReturn.details) {
		let detail = saleReturn.details[index];

		if (!detail.subUnit || detail.subUnit.deletedAt != null) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		if (!detail.product || detail.product.deletedAt != null) throw createError({ field: `details[${index}].product`, type: "notFound" }, 422);

		if (!detail.variant || detail.variant.deletedAt != null) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		let isVariantRelatedWithProduct = detail.product.variants.includes(detail.variant._id.toString());

		if (!isVariantRelatedWithProduct) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		if (!detail.product.availableForSaleReturn) throw createError({ field: `details[${index}].product`, type: "notAvailable" }, 422);

		if (!detail.variant.availableForSaleReturn) throw createError({ field: `details[${index}].variant`, type: "notAvailable" }, 422);

		let subUnitIsMainUnit = detail.subUnit._id.toString() == detail.product.unit.toString();

		if (!subUnitIsMainUnit && detail.subUnit.base.toString() !== detail.product.unit.toString()) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		detail.unit = detail.product.unit;

		if (saleReturn.status.effected) {
			let instock = detail.variant.getInstockByWarehouse(saleReturn.warehouse._id);

			let quantity = detail.instockBySubUnit;

			stocks.push({
				product: { _id: detail.product._id, name: detail.product.name },
				variant: { _id: detail.variant._id, name: detail.variant.name },
				warehouse: { _id: saleReturn.warehouse._id, name: saleReturn.warehouse.name, instock: { before: instock, after: quantity + instock } },
				unit: detail.unit,
				quantity
			})

			detail.variant.addToStock({ warehouse: saleReturn.warehouse._id, quantity });

			variants.push(detail.variant);
		}
	}

	if (oldSaleReturn.status.effected) {
		for (let index in oldSaleReturn.details) {
			let detail = oldSaleReturn.details[index];

			let sameVariant = variants.find(variant => variant._id.toString() == detail.variant._id.toString());

			let variant = sameVariant || detail.variant;

			let instock = variant.getInstockByWarehouse(oldSaleReturn.warehouse._id);

			let stock = stocks.find(stock => stock.product._id.toString() == detail.product._id.toString() && stock.variant._id.toString() == variant._id.toString() && stock.warehouse._id.toString() == oldSaleReturn.warehouse._id.toString());

			let quantity = detail.instockBySubUnit;

			if (!stock) {
				stock = {
					product: { _id: detail.product._id, name: detail.product.name },
					variant: { _id: detail.variant._id, name: detail.variant.name },
					warehouse: { _id: oldSaleReturn.warehouse._id, name: oldSaleReturn.warehouse.name, instock: { before: instock, after: instock } },
					unit: { _id: detail.unit._id, name: detail.unit.name },
					quantity
				};

				stocks.push(stock)
			}

			stock.warehouse.instock.after -= quantity;

			variant.subtractFromStock({ warehouse: oldSaleReturn.warehouse._id, quantity });

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

	oldSaleReturn.fill(req.body).addDetails(saleReturn.details).by(req.me._id);

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([oldSaleReturn.save({ session }), ...variants.map((variant) => variant.save({ session }))]);

		await session.commitTransaction();

		res.json({ _id: oldSaleReturn._id });
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.changeSaleReturnStatus = async (req, res) => {
	let saleReturnQuery = SaleReturn.findById(req.params.id).populate("warehouse status details.product details.variant details.unit details.subUnit");

	let statusQuery = Status.findOne({ invoice: "salesReturn", _id: req.body.statusId });

	let [saleReturn, status] = await Promise.all([saleReturnQuery, statusQuery]);

	if (!saleReturn) throw notFound();

	if (!status) throw notFound("status", 422);

	let variants = [];

	let errors = [];

	for (let detail of saleReturn.details) {
		let sameVariant = variants.find((variant) => variant._id.toString() === detail.variant._id.toString());

		let variant = sameVariant || detail.variant;

		let instock = variant.getInstockByWarehouse(saleReturn.warehouse._id);

		instock = { before: instock, after: instock };

		let quantity = detail.instockBySubUnit;

		if (saleReturn.status && saleReturn.status.effected) {
			variant.subtractFromStock({ warehouse: saleReturn.warehouse._id, quantity });
			instock.after -= quantity;
		}

		if (status.effected) {
			variant.addToStock({ warehouse: saleReturn.warehouse._id, quantity });
			instock.after += quantity;
		}

		if (instock.after < 0) {
			errors.push({
				product: { _id: detail.product._id, name: detail.product.name },
				variant: { _id: variant._id, name: variant.name },
				warehouse: { _id: saleReturn.warehouse._id, name: saleReturn.warehouse.name, instock },
				unit: { _id: detail.unit._id, name: detail.unit.name },
				quantity
			});
			continue;
		}

		if (!sameVariant) variants.push(variant);
	}

	if (errors.length > 0) throw createError({ type: "quantity", errors }, 422);

	saleReturn.status = status._id;

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([saleReturn.save({ session }), ...variants.map((variant) => variant.save({ session }))]);

		await session.commitTransaction();

		res.json({});
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.deleteSaleReturn = async (req, res) => {
	let saleReturn = await SaleReturn.findById(req.params.id, "paid status").populate("status", "effected");

	if (!saleReturn) throw notFound();

	if (saleReturn.paid) throw createError("paid", 400);

	if (saleReturn.status && saleReturn.status.effected) {
		throw createError("effected", 400);
	}

	await saleReturn.deleteBy(req.me._id);;

	res.json({});
};

exports.getPayments = async (req, res) => {
	let saleReturn = await SaleReturn.findById(req.params.id, "payments");

	if (!saleReturn) throw notFound();

	res.json({ payments: saleReturn.payments });
};

exports.createPayment = async (req, res) => {
	let saleReturn = await SaleReturn.findById(req.params.id);

	if (!saleReturn) throw notFound();

	saleReturn.addPayment({ ...req.body, createdBy: req.me._id });

	await saleReturn.save();

	res.json({});
}

exports.updatePayment = async (req, res) => {
	let saleReturn = await SaleReturn.findById(req.params.id);

	if (!saleReturn) throw notFound();

	saleReturn.editPayment(req.params.paymentId, { ...req.body, updatedBy: req.me._id });

	await saleReturn.save();

	res.json({});
}

exports.deletePayment = async (req, res) => {
	let saleReturn = await SaleReturn.findById(req.params.id);

	if (!saleReturn) throw notFound();

	saleReturn.deletePayment(req.params.paymentId);

	await saleReturn.save();

	res.json({});
}
