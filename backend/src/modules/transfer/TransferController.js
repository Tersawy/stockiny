const mongoose = require("mongoose");

const { createError, notFound } = require("../../errors/ErrorHandler");

const Transfer = require("./Transfer");

const Product = require("../product/Product");

const Status = require("../status/Status");

const Warehouse = require("../warehouse/Warehouse");

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
	let { details, fromWarehouse: fromWarehouseId, toWarehouse: toWarehouseId, status: statusId } = req.body;

	if (fromWarehouseId === toWarehouseId) throw createError("warehouse", 400);

	let transferQuery = new Transfer().fill(req.body).addDetails(details).by(req.me._id);

	let productSelect = "name unit variants._id variants.stock variants.name";

	let productIds = details.map((detail) => detail.product);

	let productsQuery = Product.find({ _id: { $in: productIds } }, productSelect).populate("unit", "name");

	transferQuery = transferQuery.populate("details.subUnit", "value operator base");

	let warehousesQuery = Warehouse.find({ _id: { $in: [fromWarehouseId, toWarehouseId] } });

	let statusQuery = Status.findOne({ _id: status, invoice: "transfers" });

	let [products, transfer, warehouses, status] = await Promise.all([productsQuery, transferQuery, warehousesQuery, statusQuery]);

	let fromWarehouse = warehouses.find(warehouse => warehouse._id.toString() === fromWarehouseId.toString());

	if (!fromWarehouse) throw createError({ field: "fromWarehouse", type: "notFound" }, 422);

	let toWarehouse = warehouses.find(warehouse => warehouse._id.toString() === toWarehouseId.toString());

	if (!toWarehouse) throw createError({ field: "toWarehouse", type: "notFound" }, 422);

	if (!status) throw createError({ field: "status", type: "notFound" }, 422);

	let session = await mongoose.startSession();

	session.startTransaction();

	// This fix => ParallelSaveError: Can't save() the same doc multiple times in parallel
	let updates = [];

	let errors = [];

	for (let detail of transfer.details) {
		let product = throwIfNotValidDetail(detail, products);

		let updatedProduct = updates.find((p) => p._id.toString() === detail.product.toString());

		product = updatedProduct || product;

		let variant = product.getVariantById(detail.variant);

		let instockFrom = variant.getInstockByWarehouse(fromWarehouseId);

		let instockTo = variant.getInstockByWarehouse(toWarehouseId);

		let quantity = detail.stock;

		if (!instockFrom || instockFrom < quantity) {
			errors.push({
				product: { _id: product._id, name: product.name },
				variant: { _id: variant._id, name: variant.name },
				fromWarehouse: { name: fromWarehouse.name, stock: { before: instockFrom, after: instockFrom - quantity } },
				toWarehouse: { name: toWarehouse.name, stock: { before: instockTo, after: instockTo + quantity } },
				unit: { _id: product.unit._id, name: product.unit.name },
				quantity
			});

			continue;
		}

		if (status.effected) {
			variant.subtractFromStock({ warehouse: fromWarehouseId, quantity });

			variant.addToStock({ warehouse: toWarehouseId, quantity });

			if (!updatedProduct) updates.push(product);
		}
	}

	if (errors.length) throw createError({ type: "quantity", errors }, 422);

	try {
		await Promise.all([transfer.save({ session }), ...updates.map((product) => product.save({ session }))]);

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

	res.json({ doc: { ...transfer.toJSON(), details } });
}

exports.getEditTransfer = async (req, res) => {
	let { id } = req.params;

	let select = "date fromWarehouse toWarehouse shipping tax discount discountMethod status reference details notes";

	let transfer = await Transfer.findById(id, select).populate("details.product", "cost variants._id variants.name variants.images variants.stock code name image").populate("details.subUnit", "value operator");

	if (!transfer) throw notFound();

	let details = transfer.details.map(detail => {
		let variant = detail.product.getVariantById(detail.variant);
		return {
			amount: detail.unitAmount,
			mainAmount: detail.product.cost,
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
			stock: variant.getInstockByWarehouse(transfer.warehouse)
		};
	});

	res.json({ doc: { ...transfer.toJSON(), details } });
};

exports.updateTransfer = async (req, res) => {
	let { details, fromWarehouse: fromWarehouseId, toWarehouse: toWarehouseId, status: statusId } = req.body;

	if (fromWarehouseId === toWarehouseId) throw createError("warehouse", 400);

	// get product in detail to update stock if status effected
	let transferQuery = Transfer.findById(req.params.id)
		.populate("details.subUnit", "operator value")
		.populate("details.unit", "name")
		.populate("details.product", "name variants._id variants.stock variants.name")
		.populate("status", "effected")
		.populate("fromWarehouse toWarehouse", "name");

	let productIds = details.map((detail) => detail.product);

	// get products for new details
	let productsQuery = Product.find({ _id: { $in: productIds } }, "name unit variants._id variants.stock variants.name").populate("unit", "name");

	let warehousesQuery = Warehouse.find({ _id: { $in: [fromWarehouseId, toWarehouseId] } });

	let statusQuery = Status.findOne({ _id: statusId, invoice: "transfers" });

	let [transfer, products, warehouses, status] = await Promise.all([transferQuery, productsQuery, warehousesQuery, statusQuery]);

	if (!transfer) throw notFound();

	let fromWarehouse = warehouses.find(warehouse => warehouse._id.toString() === fromWarehouseId.toString());

	if (!fromWarehouse) throw createError({ field: "fromWarehouse", type: "notFound" }, 422);

	let toWarehouse = warehouses.find(warehouse => warehouse._id.toString() === toWarehouseId.toString());

	if (!toWarehouse) throw createError({ field: "toWarehouse", type: "notFound" }, 422);

	if (!status) throw createError({ field: "status", type: "notFound" }, 422);

	/* ================================================= Get Initial Stock ================================================= */
	// get initial stock to send stock before update in errors if final stock is less than 0 after save
	let stocks = [];

	let getStockBefore = ({ productId, variantId }) => {
		return stocks.find(s => s.product._id.toString() == productId.toString() && s.variant._id.toString() == variantId.toString());
	}

	let updates = [];

	if (transfer.status.effected) {
		for (let detail of transfer.details) {
			// TODO:: handle if product is not found, mybe this is a bug will not happen because we don't allow to delete products
			let updatedProduct = updates.find((p) => p._id.toString() === detail.product._id.toString());

			product = updatedProduct || detail.product;

			let variant = product.getVariantById(detail.variant);

			let instockFrom = variant.getInstockByWarehouse(transfer.fromWarehouse._id);

			let instockTo = variant.getInstockByWarehouse(transfer.toWarehouse._id);

			let quantity = detail.stock;

			stocks.push({
				product: { _id: product._id, name: product.name },
				variant: { _id: variant._id, name: variant.name },
				fromWarehouse: { _id: transfer.fromWarehouse._id, name: transfer.fromWarehouse.name, stock: { before: instockFrom, after: instockFrom + quantity } },
				toWarehouse: { _id: transfer.toWarehouse._id, name: transfer.toWarehouse.name, stock: { before: instockTo, after: instockTo - quantity } },
				unit: { _id: detail.unit._id, name: detail.unit.name },
				quantity
			});

			variant.addToStock({ warehouse: transfer.fromWarehouse._id, quantity });

			variant.subtractFromStock({ warehouse: transfer.toWarehouse._id, quantity });

			if (!updatedProduct) updates.push(product);
		};
	}

	// update transfer and details
	transfer.fill(req.body).addDetails(details);

	// get subUnits for new details and check units and variants
	await transfer.populate("details.subUnit", "operator value base");

	let errors = [];

	for (let detail of transfer.details) {
		let product = throwIfNotValidDetail(detail, products);

		let updatedProduct = updates.find((p) => p._id.toString() === detail.product.toString());

		product = updatedProduct || product;

		let variant = product.getVariantById(detail.variant);

		let instockFrom = variant.getInstockByWarehouse(fromWarehouseId);

		let instockTo = variant.getInstockByWarehouse(toWarehouseId);

		let stock = getStockBefore({ productId: product._id, variantId: variant._id });

		let quantity = detail.stock;

		if (!stock) {
			stocks.push({
				product: { _id: product._id, name: product.name },
				variant: { _id: variant._id, name: variant.name },
				fromWarehouse: { _id: fromWarehouse._id, name: fromWarehouse.name, stock: { before: instockFrom, after: instockFrom - quantity } },
				toWarehouse: { _id: toWarehouse._id, name: toWarehouse.name, stock: { before: instockTo, after: instockTo + quantity } },
				unit: { _id: product.unit._id, name: product.unit.name },
				quantity
			});
		}

		if (status.effected) {
			variant.subtractFromStock({ warehouse: fromWarehouseId, quantity });

			variant.addToStock({ warehouse: toWarehouseId, quantity });

			if (!updatedProduct) updates.push(product);

			if (stock.fromWarehouse._id.toString() === fromWarehouseId.toString()) {
				stock.fromWarehouse.stock.after -= quantity;
			}

			if (stock.toWarehouse._id.toString() === toWarehouseId.toString()) {
				stock.toWarehouse.stock.after += quantity;
			}

			if (stock.fromWarehouse._id.toString() === toWarehouseId.toString()) {
				stock.fromWarehouse.stock.after += quantity;
			}

			if (stock.toWarehouse._id.toString() === fromWarehouseId.toString()) {
				stock.toWarehouse.stock.after -= quantity;
			}
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
		await Promise.all([transfer.save({ session }), ...updates.map((product) => product.save({ session }))]);

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

	let [transfer, status] = await Promise.all([transferQuery, statusQuery]);

	if (!transfer) throw notFound();

	if (!status) throw notFound("status", 422);

	// this is fix thius error ------> ** Can't save() the same doc multiple times in parallel.
	// because maybe the same product is in the details array more than one time with different variant
	let updates = [];

	let errors = [];

	for (let detail of transfer.details) {
		let product = updates.find((p) => p._id.toString() === detail.product._id.toString());

		let updatedProduct = product || detail.product;

		let variant = updatedProduct.getVariantById(detail.variant);

		let instockFrom = variant.getInstockByWarehouse(transfer.fromWarehouse._id);

		let instockTo = variant.getInstockByWarehouse(transfer.toWarehouse._id);

		let quantity = detail.stock;

		let error = {
			product: { _id: updatedProduct._id, name: updatedProduct.name },
			variant: { _id: variant._id, name: variant.name },
			fromWarehouse: { _id: transfer.fromWarehouse._id, name: transfer.fromWarehouse.name, stock: { before: instockFrom, after: instockFrom } },
			toWarehouse: { _id: transfer.toWarehouse._id, name: transfer.toWarehouse.name, stock: { before: instockTo, after: instockTo } },
			unit: { _id: detail.unit._id, name: detail.unit.name },
			quantity
		};

		if (transfer.status && transfer.status.effected) {
			variant.subtractFromStock({ warehouse: transfer.toWarehouse._id, quantity });
			variant.addToStock({ warehouse: transfer.fromWarehouse._id, quantity });

			error.toWarehouse.stock.after -= quantity;
			error.fromWarehouse.stock.after += quantity;
		}

		if (status.effected) {
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

