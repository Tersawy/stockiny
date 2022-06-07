const mongoose = require("mongoose");

const { createError, notFound } = require("../../errors/ErrorHandler");

const Product = require("../product/Product");

const Warehouse = require("../warehouse/Warehouse");

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
	let { details, warehouse: warehouseId, status: statusId } = req.body;

	let adjustment = new Adjustment().fill(req.body).addDetails(details).by(req.me._id);

	let productSelect = "name unit variants._id variants.name variants.stock";

	let productIds = details.map((detail) => detail.product);

	let productsQuery = Product.find({ _id: { $in: productIds } }, productSelect).populate("unit", "name");

	let statusQuery = Status.findOne({ invoice: "adjustments", _id: statusId }, "effected");

	let warehouseQuery = Warehouse.findById(warehouseId, "name");

	let [products, status, warehouse] = await Promise.all([productsQuery, statusQuery, warehouseQuery, adjustment.populate("details.subUnit", "value operator base")]);

	if (!status) throw notFound("status", 422);

	if (!warehouse) throw notFound("warehouse", 422);

	let session = await mongoose.startSession();

	session.startTransaction();

	// This fix => ParallelSaveError: Can't save() the same doc multiple times in parallel
	let productsUpdated = [];

	let errors = [];

	for (let detail of adjustment.details) {
		let product = throwIfNotValidDetail(detail, products);

		if (status.effected) {
			// TODO:: handle if product is not found, mybe this is a bug will not happen because we don't allow to delete products
			let updatedProduct = productsUpdated.find((p) => p._id.toString() === detail.product._id.toString());

			product = updatedProduct || product;

			let variant = product.getVariantById(detail.variant);

			let instock = variant.getInstockByWarehouse(warehouseId);

			let quantity = detail.stock;

			let error = {
				product: { _id: product._id, name: product.name },
				variant: { _id: variant._id, name: variant.name },
				warehouse: { _id: warehouseId, name: warehouse.name, stock: { before: instock, after: instock } },
				unit: { _id: product.unit._id, name: product.unit.name },
				quantity
			}

			if (detail.isAddition) {
				variant.addToStock({ warehouse: warehouse._id, quantity });
				error.warehouse.stock.after += quantity;
			} else {
				variant.subtractFromStock({ warehouse: warehouse._id, quantity });
				error.warehouse.stock.after -= quantity;
			}

			if (error.warehouse.stock.after < 0) {
				errors.push(error);
				continue;
			}

			if (!updatedProduct) productsUpdated.push(product);
		}
	}

	if (errors.length) throw createError({ type: "quantity", errors }, 422);

	try {
		await Promise.all([adjustment.save({ session }), ...productsUpdated.map((product) => product.save({ session }))]);

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
		.populate("details.product", "name code variants._id variants.name")
		.populate("status", "name color")
		.populate("createdBy", "fullname");

	if (!adjustment) throw notFound();

	let details = adjustment.details.map((detail) => ({
		_id: detail._id,
		product: { _id: detail.product._id, name: detail.product.name, code: detail.product.code },
		variant: detail.product.getVariantById(detail.variant),
		subUnit: detail.subUnit,
		quantity: detail.quantity,
		type: detail.type,
	}));

	res.json({ doc: { ...adjustment.toJSON(), details } });
}

exports.getEditAdjustment = async (req, res) => {
	let { id } = req.params;

	let select = "date warehouse status reference details notes";

	let adjustment = await Adjustment.findById(id, select).populate("details.product", "variants._id variants.name variants.images variants.stock code name image").populate("details.subUnit", "value operator");

	if (!adjustment) throw notFound();

	let details = adjustment.details.map(detail => {
		let variant = detail.product.getVariantById(detail.variant);

		return {
			product: detail.product._id,
			variantId: detail.variant,
			code: detail.product.code,
			name: detail.product.name,
			variantName: variant.name,
			type: detail.type,
			image: variant.defaultImage || detail.product.image,
			quantity: detail.quantity,
			stock: variant.getInstockByWarehouse(adjustment.warehouse),
			unit: detail.unit,
			subUnit: detail.subUnit._id
		};
	});

	res.json({ doc: { ...adjustment.toJSON(), details } });
};

exports.updateAdjustment = async (req, res) => {
	let { details, warehouse: warehouseId, status: statusId } = req.body;

	// get product in detail to update stock if status effected
	let adjustmentQuery = Adjustment.findById(req.params.id)
		.populate("details.subUnit", "operator value")
		.populate("details.unit", "name")
		.populate("details.product", "name variants._id variants.stock variants.name")
		.populate("status", "effected")
		.populate("warehouse", "name");

	let productIds = details.map((detail) => detail.product);

	// get products for new details
	let productsQuery = Product.find({ _id: { $in: productIds } }, "name unit variants._id variants.stock variants.name").populate("unit", "name");

	let warehouseQuery = Warehouse.findById(warehouseId, "name");

	let statusQuery = Status.findOne({ invoice: "adjustments", _id: statusId }, "effected");

	let [adjustment, products, warehouse, status] = await Promise.all([adjustmentQuery, productsQuery, warehouseQuery, statusQuery]);

	if (!adjustment) throw notFound();

	if (!status) throw notFound("status", 422);

	if (!warehouse) throw notFound("warehouse", 422);

	/* ================================================= Get Initial Stock ================================================= */
	// get initial stock to send stock before update in errors if final stock is less than 0 after save
	let stocksBefore = [];

	let getStockBefore = ({ productId, variantId, warehouseId }) => {
		return stocksBefore.find(s => s.product._id.toString() == productId.toString() && s.variant._id.toString() == variantId.toString() && s.warehouse._id.toString() == warehouseId.toString());
	}

	for (let detail of adjustment.details) {
		let variant = detail.product.getVariantById(detail.variant);

		let instock = variant.getInstockByWarehouse(adjustment.warehouse._id);

		stocksBefore.push({
			product: { _id: detail.product._id, name: detail.product.name },
			variant: { _id: variant._id, name: variant.name },
			warehouse: { _id: adjustment.warehouse._id, name: adjustment.warehouse.name, stock: { before: instock, after: instock } },
			unit: { _id: detail.unit._id, name: detail.unit.name },
			quantity: detail.quantity
		});
	}

	for (let detail of details) {
		let product = products.find((p) => p._id.toString() === detail.product.toString());

		if (product) {
			let variant = product.getVariantById(detail.variant);

			if (variant) {
				let stockBefore = getStockBefore({ productId: detail.product, variantId: detail.variant, warehouseId });

				if (stockBefore) continue;

				let instock = variant.getInstockByWarehouse(warehouseId);

				stocksBefore.push({
					product: { _id: product._id, name: product.name },
					variant: { _id: variant._id, name: variant.name },
					warehouse: { _id: warehouse._id, name: warehouse.name, stock: { before: instock, after: instock } },
					unit: { _id: product.unit._id, name: product.unit.name },
					quantity: detail.quantity
				});
			}
		}
	};
	/* ===================================================================================================================== */

	let productsUpdated = [];

	// if adjustment status effected, update stock
	if (adjustment.status.effected) {
		for (let detail of adjustment.details) {
			// TODO:: handle if product is not found, mybe this is a bug will not happen because we don't allow to delete products
			let productUpdated = productsUpdated.find((p) => p._id.toString() === detail.product._id.toString());

			let product = productUpdated || detail.product;

			let variant = product.getVariantById(detail.variant);

			let quantity = detail.stock; // detail.stock is the new quantity to add to stock getted from detail schema (not from request)

			let stockBefore = getStockBefore({ productId: detail.product._id, variantId: detail.variant, warehouseId: adjustment.warehouse._id });

			if (detail.isAddition) {
				variant.subtractFromStock({ warehouse: adjustment.warehouse._id, quantity });
				stockBefore.warehouse.stock.after -= quantity;
			} else {
				variant.addToStock({ warehouse: adjustment.warehouse._id, quantity });
				stockBefore.warehouse.stock.after += quantity;
			}

			if (!productUpdated) productsUpdated.push(product);
		}
	}

	// update adjustment and details
	adjustment.fill(req.body).addDetails(details).by(req.me._id);

	// // get subUnits for new details and check units and variants
	await adjustment.populate("details.subUnit", "operator value base");

	for (let detail of adjustment.details) {
		throwIfNotValidDetail(detail, products);
	}

	// if adjustment status effected, update stock
	if (status.effected) {
		for (let detail of adjustment.details) {
			let product = products.find((p) => p._id.toString() === detail.product.toString());

			let updatedProduct = productsUpdated.find((p) => p._id.toString() === product._id.toString());

			product = updatedProduct || product;

			let variant = product.getVariantById(detail.variant);

			let quantity = detail.stock; // detail.stock is the new quantity to add to stock getted from detail schema (not from request)

			let stockBefore = getStockBefore({ productId: detail.product._id, variantId: detail.variant, warehouseId });

			if (detail.isAddition) {
				variant.addToStock({ warehouse: warehouseId, quantity });
				stockBefore.warehouse.stock.after += quantity;
			} else {
				variant.subtractFromStock({ warehouse: warehouseId, quantity });
				stockBefore.warehouse.stock.after -= quantity;
			}

			if (!updatedProduct) productsUpdated.push(product);
		}
	}

	let errors = [];

	if (productsUpdated.length > 0) {
		for (let stockBefore of stocksBefore) {
			if (stockBefore.warehouse.stock.after < 0) {
				errors.push(stockBefore);
			}
		}
	}

	if (errors.length > 0) throw createError({ type: "quantity", errors }, 422);

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([adjustment.save({ session }), ...productsUpdated.map((product) => product.save({ session }))]);

		await session.commitTransaction();

		res.json({ _id: adjustment._id });
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.changeAdjustmentStatus = async (req, res) => {
	const { statusId } = req.body;

	// get product in detail to update stock
	let adjustmentQuery = Adjustment.findById(req.params.id)
		.populate("details.subUnit", "operator value")
		.populate("details.unit", "name")
		.populate("details.product", "name variants._id variants.stock variants.name")
		.populate("warehouse", "name")
		.populate("status", "effected");

	let statusQuery = Status.findOne({ _id: statusId, type: "adjustments" });

	let [adjustment, status] = await Promise.all([adjustmentQuery, statusQuery]);

	if (!adjustment) throw notFound();

	if (!status) throw notFound("status", 422);

	// this is fix thius error ------> ** Can't save() the same doc multiple times in parallel.
	// because maybe the same product is in the details array more than one time with different variant
	let updates = [];

	let errors = [];

	for (let detail of adjustment.details) {
		let product = updates.find((p) => p._id.toString() === detail.product._id.toString());

		let updatedProduct = product || detail.product;

		let variant = detail.product.getVariantById(detail.variant);

		let stockBefore = variant.getInstockByWarehouse(adjustment.warehouse._id);

		let stockAfter = stockBefore;

		let quantity = detail.stock;

		if (adjustment.status.effected) {
			if (detail.isAddition) {
				variant.subtractFromStock({ warehouse: adjustment.warehouse._id, quantity });
				stockAfter -= quantity;
			} else {
				variant.addToStock({ warehouse: adjustment.warehouse._id, quantity });
				stockAfter += quantity;
			}
		}

		if (status.effected) {
			if (detail.isAddition) {
				variant.addToStock({ warehouse: adjustment.warehouse._id, quantity });
				stockAfter += quantity;
			} else {
				variant.subtractFromStock({ warehouse: adjustment.warehouse._id, quantity });
				stockAfter -= quantity;
			}
		}

		if (stockAfter < 0) {
			errors.push({
				product: { _id: detail.product._id, name: detail.product.name },
				variant: { _id: variant._id, name: variant.name },
				warehouse: { _id: adjustment.warehouse._id, name: adjustment.warehouse.name, stock: { before: stockBefore, after: stockAfter } },
				unit: { _id: detail.unit._id, name: detail.unit.name },
				quantity,
			});
		}

		if (!product) updates.push(updatedProduct);
	}

	if (errors.length > 0) throw createError({ type: "quantity", errors }, 422);

	adjustment.status = status._id;

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		// MongoServerError: Transaction numbers are only allowed on a replica set member or mongos
		// https://stackoverflow.com/questions/51461952/mongodb-v4-0-transaction-mongoerror-transaction-numbers-are-only-allowed-on-a
		await Promise.all([adjustment.save({ session }), ...updates.map((p) => p.save({ session }))]);

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
	let { id } = req.params;

	let adjustment = await Adjustment.findById(id, "status").populate("status", "effected");

	if (!adjustment) throw notFound();

	if (adjustment.status.effected) {
		throw createError("effected", 400);
	}

	await adjustment.deleteBy(req.me._id);;

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

// let getProductsByDetails = async (details) => {
// 	/*
// 		{ $or: [ { _id: detail.product, "variants._id": detail.variant } ] }
// 	*/

// 	let query = { $or: [] };

// 	for (let detail of details) {
// 		query.$or.push({ _id: detail.product, "variants._id": detail.variant, availableForAdjustment: true });
// 	}

// 	let variantsIds = details.map((detail) => detail.variant);

// 	let products = await Product.find(query, { _id: 1, variants: { $elemMatch: { _id: { $in: variantsIds } } } })
// 		.populate({
// 			path: "unit",
// 			select: { _id: 1, value: 1, operator: 1 },
// 		})
// 		.populate({
// 			path: "adjustmentUnit",
// 			select: { _id: 1, value: 1, operator: 1 },
// 		});

// 	return products;
// };

// exports.getProductsByDetails = getProductsByDetails;

// let getUnitsByDetails = (details, select = "") => {
// 	/*
// 		{ $or: [ { _id: detail.unit } ] }
// 	*/

// 	let $or = details.map((detail) => ({ _id: detail.unit }));

// 	return Unit.find({ $or }, select);
// };
