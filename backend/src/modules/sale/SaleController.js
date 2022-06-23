const mongoose = require("mongoose");

const { createError, notFound } = require("../../errors/ErrorHandler");
const Customer = require("../customer/Customer");

const Product = require("../product/Product");

const Status = require("../status/Status");

const Warehouse = require("../warehouse/Warehouse");

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
	let { details, warehouse: warehouseId, status: statusId } = req.body;

	let sale = new Sale().fill(req.body).addDetails(details).by(req.me._id);

	let productSelect = "name availableForSale unit variants._id variants.availableForSale variants.stock variants.name";

	let productIds = details.map((detail) => detail.product);

	let productsQuery = Product.find({ _id: { $in: productIds } }, productSelect).populate("unit", "name");

	let customerQuery = Customer.findById(req.body.customer, "_id");

	let warehouseQuery = Warehouse.findById(warehouseId, "name");

	let statusQuery = Status.findOne({ invoice: "sales", _id: statusId }, "effected");

	// ! we can't get unit with new populate because it will be get from product
	let [products, warehouse, status, customer] = await Promise.all([productsQuery, warehouseQuery, statusQuery, customerQuery, sale.populate("details.subUnit", "name value operator base")]);

	if (!warehouse) throw notFound("warehouse", 422);

	if (!status) throw notFound("status", 422);

	if (!customer) throw notFound("customer", 422);

	let session = await mongoose.startSession();

	session.startTransaction();

	// This fix => ParallelSaveError: Can't save() the same doc multiple times in parallel
	let updates = [];

	let errors = [];

	for (let detail of sale.details) {
		let product = throwIfNotValidDetail(detail, products);

		let updatedProduct = updates.find((p) => p._id.toString() === detail.product.toString());

		product = updatedProduct || product;

		let variant = product.getVariantById(detail.variant);

		let instock = variant.getInstockByWarehouse(warehouseId);

		let quantity = detail.stock;

		if (status.effected) {
			let stockAfter = instock - quantity;

			if (stockAfter < 0) {
				errors.push({
					product: { _id: product._id, name: product.name },
					variant: { _id: variant._id, name: variant.name },
					warehouse: { _id: warehouseId, name: warehouse.name, stock: { before: instock, after: stockAfter } },
					unit: { _id: product.unit._id, name: product.unit.name },
					quantity
				});

				continue;
			}

			variant.subtractFromStock({ warehouse: warehouseId, quantity });

			if (!updatedProduct) updates.push(product);
		}
	}

	if (errors.length) throw createError({ type: "quantity", errors }, 422);

	try {
		await Promise.all([sale.save({ session }), ...updates.map((product) => product.save({ session }))]);

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
		.populate("details.product", "name code variants._id variants.name")
		.populate("status", "name color")
		.populate("createdBy", "fullname");

	if (!sale) throw notFound();

	let details = sale.details.map((detail) => {
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

	res.json({ doc: { ...sale.toJSON(), details } });
}

exports.getEditSale = async (req, res) => {
	let { id } = req.params;

	let select = "date warehouse customer shipping tax discount discountMethod status reference details notes";

	let sale = await Sale.findById(id, select).populate("details.product", "price variants._id variants.name variants.images variants.stock code name image").populate("details.subUnit", "value operator");

	if (!sale) throw notFound();

	let details = sale.details.map(detail => {
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
			stock: variant.getInstockByWarehouse(sale.warehouse),
		};
	});

	res.json({ doc: { ...sale.toJSON(), details } });
};

exports.updateSale = async (req, res) => {
	let { details, warehouse: warehouseId, status: statusId } = req.body;

	// get product in detail to update stock if status effected
	let saleQuery = Sale.findById(req.params.id)
		.populate("details.subUnit", "operator value")
		.populate("details.unit", "name")
		.populate("details.product", "name variants._id variants.stock variants.name")
		.populate("status", "effected")
		.populate("warehouse", "name");

	let productIds = details.map((detail) => detail.product);

	// get products for new details
	let productsQuery = Product.find({ _id: { $in: productIds } }, "name availableForSale unit variants._id variants.availableForSale variants.stock variants.name").populate("unit", "name");

	let customerQuery = Customer.findById(req.body.customer, "_id");

	let warehouseQuery = Warehouse.findById(warehouseId, "name");

	let statusQuery = Status.findOne({ invoice: "sales", _id: statusId }, "effected");

	let [sale, products, customer, warehouse, status] = await Promise.all([saleQuery, productsQuery, customerQuery, warehouseQuery, statusQuery]);

	if (!sale) throw notFound();

	if (!customer) throw notFound("customer", 422);

	if (!warehouse) throw notFound("warehouse", 422);

	if (!status) throw notFound("status", 422);

	/* ================================================= Get Initial Stock ================================================= */
	// get initial stock to send stock before update in errors if final stock is less than 0 after save
	let stocks = [];

	let getStockBefore = ({ productId, variantId, warehouseId }) => {
		return stocks.find(s => s.product._id.toString() == productId.toString() && s.variant._id.toString() == variantId.toString() && s.warehouse._id.toString() == warehouseId.toString());
	}

	for (let detail of sale.details) {
		let variant = detail.product.getVariantById(detail.variant);

		let instock = variant.getInstockByWarehouse(sale.warehouse._id);

		stocks.push({
			product: { _id: detail.product._id, name: detail.product.name },
			variant: { _id: variant._id, name: variant.name },
			warehouse: { _id: sale.warehouse._id, name: sale.warehouse.name, stock: { before: instock, after: instock } },
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
	}
	/* ===================================================================================================================== */

	let updates = [];

	// if sale status effected, update stock
	if (sale.status && sale.status.effected) {
		for (let detail of sale.details) {
			// TODO:: handle if product is not found, mybe this is a bug will not happen because we don't allow to delete products
			let productUpdated = updates.find((p) => p._id.toString() === detail.product._id.toString());

			let product = productUpdated || detail.product;

			let variant = product.getVariantById(detail.variant);

			let quantity = detail.stock; // detail.stock is the new quantity to add to stock getted from detail schema (not from request)

			let stockBefore = getStockBefore({ productId: product._id, variantId: variant._id, warehouseId: sale.warehouse._id });

			variant.addToStock({ warehouse: sale.warehouse._id, quantity });

			stockBefore.warehouse.stock.after += quantity;

			if (!productUpdated) updates.push(product);
		}
	}

	// update sale and details
	sale.fill(req.body).addDetails(details);

	// // get subUnits for new details and check units and variants
	await sale.populate("details.subUnit", "operator value base");

	for (let detail of sale.details) {
		throwIfNotValidDetail(detail, products);
	}

	// if sale status effected, update stock
	if (status.effected) {
		for (let detail of sale.details) {
			let product = products.find((p) => p._id.toString() === detail.product.toString());

			let updatedProduct = updates.find((p) => p._id.toString() === product._id.toString());

			product = updatedProduct || product;

			let variant = product.getVariantById(detail.variant);

			let quantity = detail.stock; // detail.stock is the new quantity to add to stock getted from detail schema (not from request)

			let stockBefore = getStockBefore({ productId: product._id, variantId: variant._id, warehouseId });

			variant.subtractFromStock({ warehouse: warehouseId, quantity });

			stockBefore.warehouse.stock.after -= quantity;

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
		await Promise.all([sale.save({ session }), ...updates.map((product) => product.save({ session }))]);

		await session.commitTransaction();

		res.json({ _id: sale._id });
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.changeSaleStatus = async (req, res) => {
	const { statusId } = req.body;

	// get product in detail to update stock
	let saleQuery = Sale.findById(req.params.id)
		.populate("details.subUnit", "operator value")
		.populate("details.unit", "name")
		.populate("details.product", "name variants._id variants.stock variants.name")
		.populate("warehouse", "name")
		.populate("status", "effected");

	let statusQuery = Status.findOne({ invoice: "sales", _id: statusId });

	let [sale, status] = await Promise.all([saleQuery, statusQuery]);

	if (!sale) throw notFound();

	if (!status) throw notFound("status", 422);

	// this is fix thius error ------> ** Can't save() the same doc multiple times in parallel.
	// because maybe the same product is in the details array more than one time with different variant
	let updates = [];

	let errors = [];

	for (let detail of sale.details) {
		let updatedProduct = updates.find((p) => p._id.toString() === detail.product._id.toString());

		let product = updatedProduct || detail.product;

		// get real stock before any operation
		let variant = detail.product.getVariantById(detail.variant);

		let stock = { before: variant.getInstockByWarehouse(sale.warehouse._id), after: 0 };

		let quantity = detail.stock;

		if (sale.status && sale.status.effected) {
			variant.addToStock({ warehouse: sale.warehouse._id, quantity });
			stock.after = stock.before + quantity;
		}

		if (status.effected) {
			variant.subtractFromStock({ warehouse: sale.warehouse._id, quantity });
			stock.after = stock.before - quantity;
		}

		if (stock.after < 0) {
			errors.push({
				product: { _id: product._id, name: product.name },
				variant: { _id: variant._id, name: variant.name },
				warehouse: { _id: sale.warehouse._id, name: sale.warehouse.name, stock },
				unit: { _id: detail.unit._id, name: detail.unit.name },
				quantity
			});
			continue;
		}

		if (!updatedProduct) updates.push(product);
	}

	if (errors.length > 0) throw createError({ type: "quantity", errors }, 422);

	sale.status = status._id;

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		// MongoServerError: Transaction numbers are only allowed on a replica set member or mongos
		// https://stackoverflow.com/questions/51461952/mongodb-v4-0-transaction-mongoerror-transaction-numbers-are-only-allowed-on-a
		await Promise.all([sale.save({ session }), ...updates.map((p) => p.save({ session }))]);

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
	let { id } = req.params;

	let sale = await Sale.findById(id, "paid status").populate("status", "effected");

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

let throwIfNotValidDetail = (detail, products) => {
	let { product, variant, subUnit, unit } = detail;

	let e = (field, type = "notFound") => {
		return createError({ field: `details.${field}`, type, product, variant }, 422);
	};

	product = products.find((p) => p._id.toString() === product.toString());

	if (!product) throw e("product");

	if (!product.availableForSale) throw e("product", "notAvailable");

	if (detail.unit) { // in update we get unit with detail so we don't need to set it again from product
		unit = detail.unit._id || detail.unit;
	} else {
		unit = detail.unit = (product.unit._id || product.unit);
	}

	variant = product.getVariantById(detail.variant);

	if (!variant) throw e("variant", "notFound");

	if (!variant.availableForSale) throw e("variant", "notAvailable");

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
// 		query.$or.push({ _id: detail.product, "variants._id": detail.variant, availableForSale: true });
// 	}

// 	let variantsIds = details.map((detail) => detail.variant);

// 	let products = await Product.find(query, { _id: 1, variants: { $elemMatch: { _id: { $in: variantsIds } } } })
// 		.populate({
// 			path: "unit",
// 			select: { _id: 1, value: 1, operator: 1 },
// 		})
// 		.populate({
// 			path: "saleUnit",
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
