const mongoose = require("mongoose");

const { createError, notFound } = require("../../errors/ErrorHandler");

const Status = require("../status/Status");

const Sale = require("./Sale");

exports.getSales = async (req, res) => {
	let select = "date reference customer warehouse status total paid paymentStatus";

	let filterOptions = { query: req.query, filterationFields: ["date", "customer", "warehouse", "status"] };

	let paymentStatus = req.query.paymentStatus;

	let queries = { paid: "this.total === this.paid", unpaid: "this.paid === 0", partial: "this.paid < this.total && this.paid != 0" }

	paymentStatus = (Object.keys(queries).includes(paymentStatus) && { $where: queries[paymentStatus] } || {});

	let query = Sale.find(paymentStatus, select)
		.withPagination(req.query)
		.withSearch(req.query)
		.withFilter(filterOptions)
		.populate("customer warehouse", "name")
		.populate("status", "name color");

	let counts = Sale.count().withSearch(req.query).withFilter(filterOptions);

	let [docs, total] = await Promise.all([query, counts]);

	docs.forEach((doc) => {
		doc._doc.paymentStatus = doc.paymentStatus;
	});

	res.json({ docs, total });
};

exports.createSale = async (req, res) => {
	let sale = new Sale().fill(req.body).addDetails(req.body.details).by(req.me._id);

	await sale.populate("customer warehouse status details.subUnit details.variant details.product");

	if (!sale.customer || sale.customer.deletedAt != null) throw notFound("customer", 422);

	if (!sale.warehouse || sale.warehouse.deletedAt != null) throw notFound("warehouse", 422);

	if (!sale.status || sale.status.deletedAt != null) throw notFound("status", 422);

	let variants = [];

	let errors = [];

	for (let index in sale.details) {
		let detail = sale.details[index];

		if (!detail.subUnit || detail.subUnit.deletedAt != null) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		if (!detail.product || detail.product.deletedAt != null) throw createError({ field: `details[${index}].product`, type: "notFound" }, 422);

		if (!detail.variant || detail.variant.deletedAt != null) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		let isVariantRelatedWithProduct = detail.product.variants.includes(detail.variant._id.toString());

		if (!isVariantRelatedWithProduct) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		if (!detail.product.availableForSale) throw createError({ field: `details[${index}].product`, type: "notAvailable" }, 422);

		if (!detail.variant.availableForSale) throw createError({ field: `details[${index}].variant`, type: "notAvailable" }, 422);

		let subUnitIsMainUnit = detail.subUnit._id.toString() == detail.product.unit.toString();

		if (!subUnitIsMainUnit && detail.subUnit.base.toString() !== detail.product.unit.toString()) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		detail.unit = detail.product.unit;

		if (sale.status.effected) {
			let instock = detail.variant.getInstockByWarehouse(sale.warehouse._id);

			let quantity = detail.instockBySubUnit;

			if (instock < quantity) {
				errors.push({
					product: { _id: detail.product._id, name: detail.product.name },
					variant: { _id: detail.variant._id, name: detail.variant.name },
					warehouse: { _id: sale.warehouse._id, name: sale.warehouse.name, instock: { before: instock, after: instock - quantity } },
					unit: detail.unit,
					quantity
				});

				continue;
			}

			detail.variant.subtractFromStock({ warehouse: sale.warehouse._id, quantity });

			variants.push(detail.variant);
		}
	}

	if (errors.length) throw createError({ type: "quantity", errors }, 422);

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([sale.save({ session }), ...variants.map((variant) => variant.save({ session }))]);

		await session.commitTransaction();

		res.json({ _id: sale._id });
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.getSale = async (req, res) => {
	let sale = await Sale.findById(req.params.id, "tax discount discountMethod shipping paid date details createdBy status customer warehouse total reference createdAt")
		.populate("customer", "name email phone zipCode address city country")
		.populate("warehouse", "name email phone zipCode address city country")
		.populate("details.subUnit", "name")
		.populate("details.product", "name code")
		.populate("details.variant", "name")
		.populate("status", "name color")
		.populate("createdBy", "fullname");

	if (!sale) throw notFound();

	let details = sale.details.map((detail) => {
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

	res.json({ doc: { ...sale.toJSON(), details } });
}

exports.getEditSale = async (req, res) => {
	let select = "date warehouse customer shipping tax discount discountMethod status reference details notes";

	let sale = await Sale.findById(req.params.id, select).populate("details.product", "price code name image").populate("details.variant", "name images stocks").populate("details.subUnit", "value operator");

	if (!sale) throw notFound();

	let details = sale.details.map(detail => {
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
			instock: detail.variant.getInstockByWarehouse(sale.warehouse)
		};
	});

	res.json({ doc: { ...sale.toJSON(), details } });
};

exports.updateSale = async (req, res) => {
	let oldSaleQuery = Sale.findById(req.params.id).populate("status warehouse details.variant details.product details.subUnit details.unit");

	let sale = new Sale().fill(req.body).addDetails(req.body.details);

	let [oldSale] = await Promise.all([oldSaleQuery, sale.populate("customer status warehouse details.variant details.product details.subUnit")]);

	if (!oldSale) throw notFound();

	if (!sale.customer || sale.customer.deletedAt != null) throw notFound("customer", 422);

	if (!sale.warehouse || sale.warehouse.deletedAt != null) throw notFound("warehouse", 422);

	if (!sale.status || sale.status.deletedAt != null) throw notFound("status", 422);

	let variants = [];

	let stocks = [];

	for (let index in sale.details) {
		let detail = sale.details[index];

		if (!detail.subUnit || detail.subUnit.deletedAt != null) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		if (!detail.product || detail.product.deletedAt != null) throw createError({ field: `details[${index}].product`, type: "notFound" }, 422);

		if (!detail.variant || detail.variant.deletedAt != null) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		let isVariantRelatedWithProduct = detail.product.variants.includes(detail.variant._id.toString());

		if (!isVariantRelatedWithProduct) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		if (!detail.product.availableForSale) throw createError({ field: `details[${index}].product`, type: "notAvailable" }, 422);

		if (!detail.variant.availableForSale) throw createError({ field: `details[${index}].variant`, type: "notAvailable" }, 422);

		let subUnitIsMainUnit = detail.subUnit._id.toString() == detail.product.unit.toString();

		if (!subUnitIsMainUnit && detail.subUnit.base.toString() !== detail.product.unit.toString()) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		detail.unit = detail.product.unit;

		if (sale.status.effected) {
			let instock = detail.variant.getInstockByWarehouse(sale.warehouse._id);

			let quantity = detail.instockBySubUnit;

			stocks.push({
				product: { _id: detail.product._id, name: detail.product.name },
				variant: { _id: detail.variant._id, name: detail.variant.name },
				warehouse: { _id: sale.warehouse._id, name: sale.warehouse.name, instock: { before: instock, after: instock - quantity } },
				unit: detail.unit,
				quantity
			})

			detail.variant.subtractFromStock({ warehouse: sale.warehouse._id, quantity });

			variants.push(detail.variant);
		}
	}

	if (oldSale.status.effected) {
		for (let index in oldSale.details) {
			let detail = oldSale.details[index];

			let sameVariant = variants.find(variant => variant._id.toString() == detail.variant._id.toString());

			let variant = sameVariant || detail.variant;

			let instock = variant.getInstockByWarehouse(oldSale.warehouse._id);

			let stock = stocks.find(stock => stock.product._id.toString() == detail.product._id.toString() && stock.variant._id.toString() == variant._id.toString() && stock.warehouse._id.toString() == oldSale.warehouse._id.toString());

			let quantity = detail.instockBySubUnit;

			if (!stock) {
				stock = {
					product: { _id: detail.product._id, name: detail.product.name },
					variant: { _id: detail.variant._id, name: detail.variant.name },
					warehouse: { _id: oldSale.warehouse._id, name: oldSale.warehouse.name, instock: { before: instock, after: instock } },
					unit: { _id: detail.unit._id, name: detail.unit.name },
					quantity
				};

				stocks.push(stock);
			}

			stock.warehouse.instock.after += quantity;

			variant.addToStock({ warehouse: oldSale.warehouse._id, quantity });

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

	oldSale.fill(req.body).addDetails(sale.details).by(req.me._id);

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([oldSale.save({ session }), ...variants.map((variant) => variant.save({ session }))]);

		await session.commitTransaction();

		res.json({ _id: oldSale._id });
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.changeSaleStatus = async (req, res) => {
	let saleQuery = Sale.findById(req.params.id).populate("warehouse status details.product details.variant details.unit details.subUnit");

	let statusQuery = Status.findOne({ invoice: "sales", _id: req.body.statusId });

	let [sale, status] = await Promise.all([saleQuery, statusQuery]);

	if (!sale) throw notFound();

	if (!status) throw notFound("status", 422);

	let variants = [];

	let errors = [];

	for (let detail of sale.details) {
		let sameVariant = variants.find((variant) => variant._id.toString() === detail.variant._id.toString());

		let variant = sameVariant || detail.variant;

		let instock = variant.getInstockByWarehouse(sale.warehouse._id);

		instock = { before: instock, after: instock };

		let quantity = detail.instockBySubUnit;

		if (sale.status && sale.status.effected) {
			variant.addToStock({ warehouse: sale.warehouse._id, quantity });
			instock.after += quantity;
		}

		if (status.effected) {
			variant.subtractFromStock({ warehouse: sale.warehouse._id, quantity });
			instock.after -= quantity;
		}

		if (instock.after < 0) {
			errors.push({
				product: { _id: detail.product._id, name: detail.product.name },
				variant: { _id: variant._id, name: variant.name },
				warehouse: { _id: sale.warehouse._id, name: sale.warehouse.name, instock },
				unit: { _id: detail.unit._id, name: detail.unit.name },
				quantity
			});
			continue;
		}

		if (!sameVariant) variants.push(variant);
	}

	if (errors.length > 0) throw createError({ type: "quantity", errors }, 422);

	sale.status = status._id;

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([sale.save({ session }), ...variants.map((variant) => variant.save({ session }))]);

		await session.commitTransaction();

		res.json({});
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.deleteSale = async (req, res) => {
	let sale = await Sale.findById(req.params.id, "paid status").populate("status", "effected");

	if (!sale) throw notFound();

	if (sale.paid) throw createError("paid", 400);

	if (sale.status && sale.status.effected) {
		throw createError("effected", 400);
	}

	await sale.deleteBy(req.me._id);;

	res.json({});
};

exports.getPayments = async (req, res) => {
	let sale = await Sale.findById(req.params.id, "payments");

	if (!sale) throw notFound();

	res.json({ payments: sale.payments });
};

exports.createPayment = async (req, res) => {
	let sale = await Sale.findById(req.params.id);

	if (!sale) throw notFound();

	sale.addPayment({ ...req.body, createdBy: req.me._id });

	await sale.save();

	res.json({});
}

exports.updatePayment = async (req, res) => {
	let sale = await Sale.findById(req.params.id);

	if (!sale) throw notFound();

	sale.editPayment(req.params.paymentId, { ...req.body, updatedBy: req.me._id });

	await sale.save();

	res.json({});
}

exports.deletePayment = async (req, res) => {
	let sale = await Sale.findById(req.params.id);

	if (!sale) throw notFound();

	sale.deletePayment(req.params.paymentId);

	await sale.save();

	res.json({});
}
