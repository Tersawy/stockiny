const mongoose = require("mongoose");

const { createError, notFound } = require("../../errors/ErrorHandler");

const SaleReturn = require("./SaleReturn");

const Product = require("../product/Product");

const Customer = require("../customer/Customer");

const Status = require("../status/Status");

const Warehouse = require("../warehouse/Warehouse");

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
	let { details, warehouse: warehouseId, status: statusId, customer: customerId } = req.body;

	let saleReturn = new SaleReturn().fill(req.body).addDetails(details).by(req.me._id);

	let productSelect = "availableForSaleReturn unit variants._id variants.availableForSaleReturn variants.stock";

	let productIds = details.map((detail) => detail.product);

	let productDocs = Product.find({ _id: { $in: productIds } }, productSelect);

	let warehouseQuery = Warehouse.findById(warehouseId, "_id");

	let statusQuery = Status.findOne({ _id: statusId, invoice: "salesReturn" });

	let customerQuery = Customer.findById({ _id: customerId }, "_id");

	let [products, warehouse, status, customer] = await Promise.all([productDocs, warehouseQuery, statusQuery, customerQuery, saleReturn.populate("details.subUnit", "value operator base")]);

	if (!warehouse) throw notFound("warehouse", 422);

	if (!status) throw notFound("status", 422);

	if (!customer) throw notFound("customer", 422);

	let session = await mongoose.startSession();

	session.startTransaction();

	// This fix => ParallelSaveError: Can't save() the same doc multiple times in parallel
	let updates = [];

	for (let detail of saleReturn.details) {
		let product = throwIfNotValidDetail(detail, products);

		let updatedProduct = updates.find((p) => p._id.toString() === detail.product.toString());

		product = updatedProduct || product;

		if (status.effected) {
			product.addToStock({ warehouse: warehouseId, quantity: detail.stock, variant: detail.variant });

			if (!updatedProduct) updates.push(product);
		}
	}

	updates.push(saleReturn);

	try {
		await Promise.all(updates.map((update) => update.save({ session })));

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
		.populate("details.product", "name code variants._id variants.name")
		.populate("status", "name color")
		.populate("createdBy", "fullname");

	if (!saleReturn) throw notFound();

	let details = saleReturn.details.map((detail) => {
		let variant = detail.product.getVariantById(detail.variant);
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
			variantName: variant.name
		};
	});

	res.json({ doc: { ...saleReturn.toJSON(), details } });
}

exports.getEditSaleReturn = async (req, res) => {
	let { id } = req.params;

	let select = "date warehouse customer shipping tax discount discountMethod status reference details notes";

	let saleReturn = await SaleReturn.findById(id, select).populate("details.product", "price variants._id variants.name variants.images variants.stock code name image").populate("details.subUnit", "value operator");

	if (!saleReturn) throw notFound();

	let details = saleReturn.details.map(detail => {
		let variant = detail.product.getVariantById(detail.variant);
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
			variantId: detail.variant,
			product: detail.product._id,
			name: detail.product.name,
			code: detail.product.code,
			variantName: variant.name,
			image: variant.defaultImage || detail.product.image,
			stock: variant.getInstockByWarehouse(saleReturn.warehouse),
		};
	});

	res.json({ doc: { ...saleReturn.toJSON(), details } });
};

exports.updateSaleReturn = async (req, res) => {
	let { details, warehouse: warehouseId, status: statusId } = req.body;

	// get product in detail to update stock if status effected
	let saleReturnQuery = SaleReturn.findById(req.params.id)
		.populate("details.subUnit", "operator value")
		.populate("details.unit", "name")
		.populate("details.product", "name variants._id variants.stock variants.name")
		.populate("status", "effected")
		.populate("warehouse", "name");

	let productIds = details.map((detail) => detail.product);

	// get products for new details
	let productsQuery = Product.find({ _id: { $in: productIds } }, "name availableForSaleReturn unit variants._id variants.availableForSaleReturn variants.stock variants.name").populate("unit", "name");

	let warehouseQuery = Warehouse.findById(warehouseId, "_id");

	let statusQuery = Status.findOne({ _id: statusId, invoice: "salesReturn" });

	let customerQuery = Customer.findById({ _id: req.body.customer }, "_id");

	let [saleReturn, products, warehouse, status, customer] = await Promise.all([saleReturnQuery, productsQuery, warehouseQuery, statusQuery, customerQuery]);

	if (!saleReturn) throw notFound();

	if (!warehouse) throw notFound("warehouse", 422);

	if (!status) throw notFound("status", 422);

	if (!customer) throw notFound("customer", 422);

	/* ================================================= Get Initial Stock ================================================= */
	// get initial stock to send stock before update in errors if final stock is less than 0 after save
	let stocks = [];

	let getStockBefore = ({ productId, variantId, warehouseId }) => {
		return stocks.find(s => s.product._id.toString() == productId.toString() && s.variant._id.toString() == variantId.toString() && s.warehouse._id.toString() == warehouseId.toString());
	}

	for (let detail of saleReturn.details) {
		let variant = detail.product.getVariantById(detail.variant);

		let instock = variant.getInstockByWarehouse(saleReturn.warehouse._id);

		stocks.push({
			product: { _id: detail.product._id, name: detail.product.name },
			variant: { _id: variant._id, name: variant.name },
			warehouse: { _id: saleReturn.warehouse._id, name: saleReturn.warehouse.name, stock: { before: instock, after: instock } },
			unit: { _id: detail.unit._id, name: detail.unit.name },
			quantity: detail.stock
		});
	};

	for (let detail of details) {
		let product = products.find((p) => p._id.toString() === detail.product.toString());

		if (product) {
			let variant = product.getVariantById(detail.variant);

			if (variant) {
				let stockBefore = getStockBefore({ productId: product._id, variantId: variant._id, warehouseId });

				if (stockBefore) continue;

				let instock = variant.getInstockByWarehouse(warehouseId);

				stocks.push({
					product: { _id: product._id, name: product.name },
					variant: { _id: variant._id, name: variant.name },
					warehouse: { _id: warehouse._id, name: warehouse.name, stock: { before: instock, after: instock } },
					unit: { _id: product.unit._id, name: product.unit.name },
					quantity: detail.stock
				});
			}
		}
	};
	/* ===================================================================================================================== */

	let updates = [];

	// if saleReturn status effected, update stock
	if (saleReturn.status && saleReturn.status.effected) {
		for (let detail of saleReturn.details) {
			// TODO:: handle if product is not found, mybe this is a bug will not happen because we don't allow to delete products
			let productUpdated = updates.find((p) => p._id.toString() === detail.product._id.toString());

			let product = productUpdated || detail.product;

			let variant = product.getVariantById(detail.variant);

			let quantity = detail.stock; // detail.stock is the new quantity to add to stock getted from detail schema (not from request)

			let stockBefore = getStockBefore({ productId: product._id, variantId: variant._id, warehouseId: saleReturn.warehouse._id });

			variant.subtractFromStock({ warehouse: saleReturn.warehouse._id, quantity });

			stockBefore.warehouse.stock.after -= quantity;

			if (!productUpdated) updates.push(product);
		}
	}

	// update saleReturn and details
	saleReturn.fill(req.body).addDetails(details);

	// // get subUnits for new details and check units and variants
	await saleReturn.populate("details.subUnit", "operator value base");

	for (let detail of saleReturn.details) {
		throwIfNotValidDetail(detail, products);
	}

	// if saleReturn status effected, update stock
	if (status.effected) {
		for (let detail of saleReturn.details) {
			let product = products.find((p) => p._id.toString() === detail.product.toString());

			let updatedProduct = updates.find((p) => p._id.toString() === product._id.toString());

			product = updatedProduct || product;

			let variant = product.getVariantById(detail.variant);

			let quantity = detail.stock; // detail.stock is the new quantity to add to stock getted from detail schema (not from request)

			let stockBefore = getStockBefore({ productId: product._id, variantId: variant._id, warehouseId });

			variant.addToStock({ warehouse: warehouseId, quantity });

			stockBefore.warehouse.stock.after += quantity;

			if (!updatedProduct) updates.push(product);
		}
	}

	let errors = [];

	if (updates.length > 0) {
		for (let stockBefore of stocks) {
			if (stockBefore.warehouse.stock.after < 0) {
				errors.push(stockBefore);
			}
		}
	}

	if (errors.length > 0) throw createError({ type: "quantity", errors }, 422);

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([saleReturn.save({ session }), ...updates.map((product) => product.save({ session }))]);

		await session.commitTransaction();

		res.json({ _id: saleReturn._id });
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.changeSaleReturnStatus = async (req, res) => {
	const { statusId } = req.body;

	// get product in detail to update stock
	let saleReturnQuery = SaleReturn.findById(req.params.id)
		.populate("details.subUnit", "operator value")
		.populate("details.unit", "name")
		.populate("details.product", "name variants._id variants.stock variants.name")
		.populate("warehouse", "name")
		.populate("status", "effected");

	let statusQuery = Status.findOne({ invoice: "salesReturn", _id: statusId });

	let [saleReturn, status] = await Promise.all([saleReturnQuery, statusQuery]);

	if (!saleReturn) throw notFound();

	if (!status) throw notFound("status", 422);

	// this is fix thius error ------> ** Can't save() the same doc multiple times in parallel.
	// because maybe the same product is in the details array more than one time with different variant
	let updates = [];

	let errors = [];

	for (let detail of saleReturn.details) {
		let updatedProduct = updates.find((p) => p._id.toString() === detail.product._id.toString());

		let product = updatedProduct || detail.product;

		// get real stock before any operation
		let variant = detail.product.getVariantById(detail.variant);

		let stock = { before: variant.getInstockByWarehouse(saleReturn.warehouse._id), after: 0 };

		let quantity = detail.stock;

		if (saleReturn.status && saleReturn.status.effected) {
			variant.subtractFromStock({ warehouse: saleReturn.warehouse._id, quantity });
			stock.after = stock.before - quantity;
		}

		if (status.effected) {
			variant.addToStock({ warehouse: saleReturn.warehouse._id, quantity });
			stock.after = stock.before + quantity;
		}

		if (stock.after < 0) {
			errors.push({
				product: { _id: product._id, name: product.name },
				variant: { _id: variant._id, name: variant.name },
				warehouse: { _id: saleReturn.warehouse._id, name: saleReturn.warehouse.name, stock },
				unit: { _id: detail.unit._id, name: detail.unit.name },
				quantity
			});
			continue;
		}

		if (!updatedProduct) updates.push(product);
	}

	if (errors.length > 0) throw createError({ type: "quantity", errors }, 422);

	saleReturn.status = status._id;

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		// MongoServerError: Transaction numbers are only allowed on a replica set member or mongos
		// https://stackoverflow.com/questions/51461952/mongodb-v4-0-transaction-mongoerror-transaction-numbers-are-only-allowed-on-a
		await Promise.all([saleReturn.save({ session }), ...updates.map((p) => p.save({ session }))]);

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
	let { id } = req.params;

	let saleReturn = await SaleReturn.findById(id, "paid status").populate("status", "effected");

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

let throwIfNotValidDetail = (detail, products) => {
	let { product, variant, subUnit, unit } = detail;

	let e = (field, type = "notFound") => {
		return createError({ field: `details.${field}`, type, product, variant }, 422);
	};

	product = products.find((p) => p._id.toString() === product.toString());

	if (!product) throw e("product");

	if (!product.availableForSaleReturn) throw e("product");

	if (detail.unit) { // in update we get unit with detail so we don't need to set it again from product
		unit = detail.unit._id || detail.unit;
	} else {
		unit = detail.unit = (product.unit._id || product.unit);
	}

	variant = product.getVariantById(detail.variant);

	if (!variant) throw e("variant", "notFound");

	if (!variant.availableForSaleReturn) throw e("variant", "notAvailable");

	let mainUnitId = unit.toString();

	let subUnitId = subUnit._id && subUnit._id.toString();

	if (!mainUnitId) throw e("unit", "notFound");

	if (!subUnitId) throw e("subUnit", "notFound");

	let subUnitDoNotMatchProductUnits = subUnitId !== mainUnitId && subUnit.base.toString() !== mainUnitId;

	if (subUnitDoNotMatchProductUnits) throw e("subUnit", "notMatch");

	return product;
};
