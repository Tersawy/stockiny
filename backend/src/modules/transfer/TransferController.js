const mongoose = require("mongoose");

const { createError, notFound } = require("../../errors/ErrorHandler");

const Product = require("../product/Product");
const Status = require("../status/Status");

const Warehouse = require("../warehouse/Warehouse");

const Transfer = require("./Transfer");

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
	let { details, fromWarehouse, toWarehouse, status } = req.body;

	if (fromWarehouse === toWarehouse) throw createError("warehouse", 400);

	let transferQuery = new Transfer().fill(req.body).addDetails(details).by(req.me._id);

	let productSelect = "name unit variants._id variants.stock variants.name";

	let productIds = details.map((detail) => detail.product);

	let productsQuery = Product.find({ _id: { $in: productIds } }, productSelect).populate("unit", "name");

	transferQuery = transferQuery.populate("details.subUnit", "value operator base");

	let warehousesQuery = Warehouse.find({ _id: { $in: [fromWarehouse, toWarehouse] } });

	let statusQuery = Status.findOne({ _id: status, invoice: "transfers" });

	let [products, transfer, warehouses, statusDoc] = await Promise.all([productsQuery, transferQuery, warehousesQuery, statusQuery]);

	let fromWarehouseDoc = warehouses.find(warehouse => warehouse._id.toString() === fromWarehouse.toString());

	if (!fromWarehouseDoc) throw createError({ field: "fromWarehouse", type: "notFound" }, 422);

	let toWarehouseDoc = warehouses.find(warehouse => warehouse._id.toString() === toWarehouse.toString());

	if (!toWarehouseDoc) throw createError({ field: "toWarehouse", type: "notFound" }, 422);

	if (!statusDoc) throw createError({ field: "status", type: "notFound" }, 422);

	let session = await mongoose.startSession();

	session.startTransaction();

	// This fix => ParallelSaveError: Can't save() the same doc multiple times in parallel
	let productsUpdated = [];

	let errors = [];

	for (let detail of transfer.details) {
		let product = throwIfNotValidDetail(detail, products);

		// TODO:: handle if product is not found, mybe this is a bug will not happen because we don't allow to delete products
		let updatedProduct = productsUpdated.find((p) => p._id.toString() === detail.product._id.toString());

		product = updatedProduct || product;

		let variant = product.getVariantById(detail.variant);

		let stockInFrom = variant.getStock(fromWarehouse);

		let quantityInFrom = stockInFrom ? stockInFrom.quantity : 0;

		let stockInTo = variant.getStock(toWarehouse);

		let quantityInTo = stockInTo ? stockInTo.quantity : 0;

		let quantity = detail.stock;

		if (!quantityInFrom || quantityInFrom < quantity) {
			errors.push({
				product: { _id: product._id, name: product.name },
				variant: { _id: variant._id, name: variant.name },
				fromWarehouse: { name: fromWarehouseDoc.name, stock: { before: quantityInFrom, after: quantityInFrom - quantity } },
				toWarehouse: { name: toWarehouseDoc.name, stock: { before: quantityInTo, after: quantityInTo + quantity } },
				unit: { _id: product.unit._id, name: product.unit.name },
				quantity
			});

			continue;
		}

		if (statusDoc.effected) {
			product.subtractFromStock({ warehouse: fromWarehouse, quantity, variant: detail.variant });

			product.addToStock({ warehouse: toWarehouse, quantity, variant: detail.variant });

			if (!updatedProduct) productsUpdated.push(product);
		}
	}

	if (errors.length) throw createError({ type: "quantity", errors }, 422);

	try {
		await Promise.all([transfer.save({ session }), ...productsUpdated.map((product) => product.save({ session }))]);

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
		.populate("details.product", "name code variants._id variants.name")
		.populate("status", "name color")
		.populate("createdBy", "fullname");

	if (!transfer) throw notFound();

	let details = transfer.details.map((detail) => {

		let _detail = {
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
		};

		if (detail.product) {
			_detail.product = detail.product._id;
			_detail.name = detail.product.name;
			_detail.code = detail.product.code;

			let variant = detail.product.getVariantById(detail.variant);

			if (variant) {
				_detail.variantName = variant.name;
			}
		}

		return _detail;
	});


	transfer = transfer.toJSON();

	res.json({ doc: { ...transfer, details } });
}

exports.getEditTransfer = async (req, res) => {
	let { id } = req.params;

	let select = "date fromWarehouse toWarehouse shipping tax discount discountMethod status reference details notes";

	let transfer = await Transfer.findById(id, select).populate("details.product", "variants._id variants.name variants.images variants.stock code name image").populate("details.subUnit", "value operator");

	if (!transfer) throw notFound();

	let details = [];

	transfer.details.forEach(detail => {
		let _detail = {
			amount: detail.unitAmount,
			quantity: detail.quantity,
			tax: detail.tax,
			taxMethod: detail.taxMethod,
			discount: detail.discount,
			discountMethod: detail.discountMethod,
			unit: detail.unit,
			subUnit: detail.subUnit._id,
			variantId: detail.variant
		};

		if (detail.product) {
			_detail.product = detail.product._id;
			_detail.name = detail.product.name;
			_detail.code = detail.product.code;

			let variant = detail.product.getVariantById(detail.variant);

			if (variant) {
				_detail.variantName = variant.name;
				_detail.image = variant.defaultImage || detail.product.image;

				let stock = variant.getStock(transfer.fromWarehouse);

				_detail.stock = stock ? stock.quantity : 0;
			}
		}

		details.push(_detail);
	});

	res.json({ doc: { ...transfer._doc, details } });
};

exports.updateTransfer = async (req, res) => {
	let { details, fromWarehouse, toWarehouse, status } = req.body;

	if (fromWarehouse === toWarehouse) throw createError("warehouse", 400);

	// get product in detail to update stock if status effected
	let transferQuery = Transfer.findById(req.params.id)
		.populate("details.subUnit", "operator value")
		.populate("details.unit", "name")
		.populate("details.product", "name variants._id variants.stock variants.name")
		.populate("status", "effected")
		.populate("fromWarehouse toWarehouse", "name");

	let productIds = details.map((detail) => detail.product);

	// get products for new details
	let productsQuery = Product.find({ _id: { $in: productIds } }, "name availableForTransfer unit variants._id variants.availableForTransfer variants.stock variants.name").populate("unit", "name");

	let warehousesQuery = Warehouse.find({ _id: { $in: [fromWarehouse, toWarehouse] } });

	let statusQuery = Status.findOne({ _id: status, invoice: "transfers" });

	let [transfer, products, warehouses, statusDoc] = await Promise.all([transferQuery, productsQuery, warehousesQuery, statusQuery]);

	if (!transfer) throw notFound();

	let fromWarehouseDoc = warehouses.find(warehouse => warehouse._id.toString() === fromWarehouse.toString());

	if (!fromWarehouseDoc) throw createError({ field: "fromWarehouse", type: "notFound" }, 422);

	let toWarehouseDoc = warehouses.find(warehouse => warehouse._id.toString() === toWarehouse.toString());

	if (!toWarehouseDoc) throw createError({ field: "toWarehouse", type: "notFound" }, 422);

	if (!statusDoc) throw createError({ field: "status", type: "notFound" }, 422);

	/* ================================================= Get Initial Stock ================================================= */
	// get initial stock to send stock before update in errors if final stock is less than 0 after save
	let stocks = [];

	let productsUpdated = [];

	if (transfer.status.effected) {
		for (let detail of transfer.details) {
			// TODO:: handle if product is not found, mybe this is a bug will not happen because we don't allow to delete products
			let updatedProduct = productsUpdated.find((p) => p._id.toString() === detail.product._id.toString());

			product = updatedProduct || detail.product;

			let variant = product.getVariantById(detail.variant);

			let stockInFrom = variant.getStock(transfer.fromWarehouse._id);

			let quantityInFrom = stockInFrom ? stockInFrom.quantity : 0;

			let stockInTo = variant.getStock(transfer.toWarehouse._id);

			let quantityInTo = stockInTo ? stockInTo.quantity : 0;

			let quantity = detail.stock;

			stocks.push({
				product: { _id: product._id, name: product.name },
				variant: { _id: variant._id, name: variant.name },
				fromWarehouse: { _id: transfer.fromWarehouse._id, name: transfer.fromWarehouse.name, stock: { before: quantityInFrom, after: quantityInFrom + quantity } },
				toWarehouse: { _id: transfer.toWarehouse._id, name: transfer.toWarehouse.name, stock: { before: quantityInTo, after: quantityInTo - quantity } },
				unit: { _id: detail.unit._id, name: detail.unit.name },
				quantity
			});

			product.addToStock({ warehouse: transfer.fromWarehouse._id, quantity: detail.stock, variant: detail.variant });

			product.subtractFromStock({ warehouse: transfer.toWarehouse._id, quantity: detail.stock, variant: detail.variant });

			if (!updatedProduct) productsUpdated.push(product);
		};
	}

	// update transfer and details
	transfer.fill(req.body).addDetails(details);

	// get subUnits for new details and check units and variants
	await transfer.populate("details.subUnit", "operator value base");

	let errors = [];

	for (let detail of transfer.details) {
		let product = throwIfNotValidDetail(detail, products);

		// TODO:: handle if product is not found, mybe this is a bug will not happen because we don't allow to delete products
		let updatedProduct = productsUpdated.find((p) => p._id.toString() === detail.product._id.toString());

		product = updatedProduct || product;

		let quantity = detail.stock;

		if (statusDoc.effected) {
			product.subtractFromStock({ warehouse: fromWarehouse, quantity, variant: detail.variant });

			product.addToStock({ warehouse: toWarehouse, quantity, variant: detail.variant });

			if (!updatedProduct) productsUpdated.push(product);
		}

		let variant = product.getVariantById(detail.variant);

		let stockInFrom = variant.getStock(fromWarehouse);

		let quantityInFrom = stockInFrom ? stockInFrom.quantity : 0;

		let stockInTo = variant.getStock(toWarehouse);

		let quantityInTo = stockInTo ? stockInTo.quantity : 0;

		let stock = stocks.find(s => s.product._id.toString() === product._id.toString() && s.variant._id.toString() === variant._id.toString());

		if (!stock) {
			stocks.push({
				product: { _id: product._id, name: product.name },
				variant: { _id: variant._id, name: variant.name },
				fromWarehouse: { _id: fromWarehouseDoc._id, name: fromWarehouseDoc.name, stock: { before: quantityInFrom, after: quantityInFrom - quantity } },
				toWarehouse: { _id: toWarehouseDoc._id, name: toWarehouseDoc.name, stock: { before: quantityInTo, after: quantityInTo + quantity } },
				unit: { _id: product.unit._id, name: product.unit.name },
				quantity
			});

			continue;
		}

		if (stock.fromWarehouse._id.toString() === fromWarehouse.toString()) {
			stock.fromWarehouse.stock.after -= quantity;
		}

		if (stock.toWarehouse._id.toString() === toWarehouse.toString()) {
			stock.toWarehouse.stock.after += quantity;
		}

		if (stock.fromWarehouse._id.toString() === toWarehouse.toString()) {
			stock.fromWarehouse.stock.after += quantity;
		}

		if (stock.toWarehouse._id.toString() === fromWarehouse.toString()) {
			stock.toWarehouse.stock.after -= quantity;
		}
	}

	// check if final stock is less than 0
	for (let stock of stocks) {
		if (stock.fromWarehouse.stock.after < 0 || stock.toWarehouse.stock.after < 0) {
			errors.push(stock);
		}
	}

	if (errors.length) throw createError({ type: "quantity", errors }, 422);

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([transfer.save({ session }), ...productsUpdated.map((product) => product.save({ session }))]);

		await session.commitTransaction();

		res.json({ _id: transfer._id });
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.changeTransferStatus = async (req, res) => {
	const { statusId } = req.body;

	// get product in detail to update stock
	let transferQuery = Transfer.findById(req.params.id)
		.populate("details.subUnit", "operator value")
		.populate("details.unit", "name")
		.populate("details.product", "name variants._id variants.stock variants.name")
		.populate("toWarehouse fromWarehouse", "name")
		.populate("status", "effected");

	let statusQuery = Status.findOne({ _id: statusId, invoice: "transfers" });

	let [transfer, statusDoc] = await Promise.all([transferQuery, statusQuery]);

	if (!transfer) throw notFound();

	if (!statusDoc) throw createError({ field: "status", type: "notFound" }, 422);

	// this is fix thius error ------> ** Can't save() the same doc multiple times in parallel.
	// because maybe the same product is in the details array more than one time with different variant
	let updates = [];

	let errors = [];

	for (let detail of transfer.details) {
		let product = updates.find((p) => p._id.toString() === detail.product._id.toString());

		let updatedProduct = product || detail.product;

		let variant = updatedProduct.getVariantById(detail.variant);

		let stockInFrom = variant.getStock(transfer.fromWarehouse._id);

		let quantityInFrom = stockInFrom ? stockInFrom.quantity : 0;

		let stockInTo = variant.getStock(transfer.toWarehouse._id);

		let quantityInTo = stockInTo ? stockInTo.quantity : 0;

		let quantity = detail.stock;

		let error = {
			product: { _id: updatedProduct._id, name: updatedProduct.name },
			variant: { _id: variant._id, name: variant.name },
			fromWarehouse: { _id: transfer.fromWarehouse._id, name: transfer.fromWarehouse.name, stock: { before: quantityInFrom, after: quantityInFrom } },
			toWarehouse: { _id: transfer.toWarehouse._id, name: transfer.toWarehouse.name, stock: { before: quantityInTo, after: quantityInTo } },
			unit: { _id: detail.unit._id, name: detail.unit.name },
			quantity
		};

		if (transfer.status && transfer.status.effected) {
			variant.subtractFromStock({ warehouse: transfer.toWarehouse._id, quantity });
			variant.addToStock({ warehouse: transfer.fromWarehouse._id, quantity });

			error.toWarehouse.stock.after -= quantity;
			error.fromWarehouse.stock.after += quantity;
		}

		if (statusDoc.effected) {
			variant.subtractFromStock({ warehouse: transfer.fromWarehouse._id, quantity });
			variant.addToStock({ warehouse: transfer.toWarehouse._id, quantity });

			error.fromWarehouse.stock.after -= quantity;
			error.toWarehouse.stock.after += quantity;
		}

		if (error.fromWarehouse.stock.after < 0 || error.toWarehouse.stock.after < 0) {
			errors.push(error);
		}

		if (!product) updates.push(updatedProduct);
	}

	if (errors.length > 0) throw createError({ type: "quantity", errors }, 422);

	transfer.status = statusId;

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		// MongoServerError: Transaction numbers are only allowed on a replica set member or mongos
		// https://stackoverflow.com/questions/51461952/mongodb-v4-0-transaction-mongoerror-transaction-numbers-are-only-allowed-on-a
		await Promise.all([transfer.save({ session }), ...updates.map((p) => p.save({ session }))]);

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
	let { id } = req.params;

	let transfer = await Transfer.findById(id, "status").populate("status", "effected");

	if (!transfer) throw notFound();

	if (transfer.status && transfer.status.effected) {
		throw createError("effected", 400);
	}

	await transfer.deleteBy(req.me._id);;

	res.json({});
};

let throwIfNotValidDetail = (detail, products) => {
	let { product, variant, subUnit, unit } = detail;

	let e = (field, type = "notFound") => {
		return createError({ field: `details.${field}`, type, product, variant }, 422);
	};

	product = products.find((p) => p._id.toString() === product.toString());

	if (!product) throw e("product");

	if (detail.unit) { // in update we get unit with detail so we don't need to set it again from product
		unit = detail.unit._id || detail.unit;
	} else {
		unit = detail.unit = (product.unit._id || product.unit);
	}

	variant = product.getVariantById(detail.variant);

	if (!variant) throw e("variant", "notFound");

	let mainUnitId = unit.toString();

	let subUnitId = subUnit._id && subUnit._id.toString();

	if (!mainUnitId) throw e("unit", "notFound");

	if (!subUnitId) throw e("subUnit", "notFound");

	let subUnitDoNotMatchProductUnits = subUnitId !== mainUnitId && subUnit.base.toString() !== mainUnitId;

	if (subUnitDoNotMatchProductUnits) throw e("subUnit", "notMatch");

	return product;
};

