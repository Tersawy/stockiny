const mongoose = require("mongoose");

const { createError, notFound } = require("../../errors/ErrorHandler");

const Product = require("../product/Product");

const Purchase = require("./Purchase");

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
	let { details, warehouse, statusDoc } = req.body;

	let purchaseDoc = new Purchase().fill(req.body).addDetails(details).by(req.me._id);

	let productSelect = "_id availableForPurchase unit variants._id variants.availableForPurchase variants.stock";

	let productIds = details.map((detail) => detail.product);

	let productDocs = Product.find({ _id: { $in: productIds } }, productSelect);

	purchaseDoc = purchaseDoc.populate("details.subUnit", "_id value operator base");

	let [products, purchase] = await Promise.all([productDocs, purchaseDoc]);

	let session = await mongoose.startSession();

	session.startTransaction();

	// This fix => ParallelSaveError: Can't save() the same doc multiple times in parallel
	let productsUpdated = [];

	for (let detail of purchase.details) {
		let product = throwIfNotValidDetail(detail, products);

		// TODO:: handle if product is not found, mybe this is a bug will not happen because we don't allow to delete products
		let updatedProduct = productsUpdated.find((p) => p._id.toString() === detail.product._id.toString());

		product = updatedProduct || product;

		if (statusDoc.effected) {
			let quantity = detail.stock;

			product.addToStock({ warehouse, quantity, variant: detail.variant });

			if (!updatedProduct) productsUpdated.push(product);
		}
	}

	try {
		await Promise.all([purchase.save({ session }), ...productsUpdated.map((product) => product.save({ session }))]);

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
	let purchase = await Purchase.findById(req.params.id, "_id tax discount discountMethod shipping paid date details createdBy status supplier warehouse total reference createdAt")
		.populate("supplier", "_id name email phone zipCode address city country")
		.populate("warehouse", "_id name email phone zipCode address city country")
		.populate("details.subUnit", "_id name")
		.populate("details.product", "_id name code variants._id variants.name")
		.populate("status", "_id name color")
		.populate("createdBy", "_id fullname");

	if (!purchase) throw notFound();

	let details = purchase.details.map((detail) => {

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


	purchase = purchase.toJSON();

	res.json({ doc: { ...purchase, details } });
}

exports.getEditPurchase = async (req, res) => {
	let { id } = req.params;

	let select = "date warehouse supplier shipping tax discount discountMethod status reference details notes";

	let purchase = await Purchase.findById(id, select).populate("details.product", "variants._id variants.name variants.images variants.stock code name image").populate("details.subUnit", "value operator");

	if (!purchase) throw notFound();

	let details = [];

	purchase.details.forEach(detail => {
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

				let stock = variant.getStock(purchase.warehouse);

				_detail.stock = stock ? stock.quantity : 0;
			}
		}

		details.push(_detail);
	});

	res.json({ doc: { ...purchase._doc, details } });
};

exports.updatePurchase = async (req, res) => {
	let { details, warehouse, statusDoc, warehouseDoc } = req.body;

	// get product in detail to update stock if status effected
	let purchaseQuery = Purchase.findById(req.params.id)
		.populate("details.subUnit", "operator value")
		.populate("details.unit", "name")
		.populate("details.product", "name variants._id variants.stock variants.name")
		.populate("status", "effected")
		.populate("warehouse", "name");


	let productIds = details.map((detail) => detail.product);

	// get products for new details
	let productsQuery = Product.find({ _id: { $in: productIds } }, "name availableForPurchase unit variants._id variants.availableForPurchase variants.stock variants.name").populate("unit", "name");

	let [purchase, products] = await Promise.all([purchaseQuery, productsQuery]);

	if (!purchase) throw notFound();

	/* ================================================= Get Initial Stock ================================================= */
	// get initial stock to send stock before update in errors if final stock is less than 0 after save
	let stocksBefore = [];

	for (let detail of purchase.details) {
		let variant = detail.product.getVariantById(detail.variant);

		if (variant) {
			let stock = variant.getStock(purchase.warehouse);

			if (stock) {
				let _stock = {
					product: { _id: detail.product._id, name: detail.product.name },
					variant: { _id: detail.variant._id, name: detail.variant.name },
					warehouse: { _id: purchase.warehouse._id, name: purchase.warehouse.name },
					stock: stock.quantity,
					unitName: detail.unit.name
				};

				stocksBefore.push(_stock);
			}
		}
	};

	for (let detail of details) {
		let product = products.find((p) => p._id.toString() === detail.product.toString());

		if (product) {
			let variant = product.getVariantById(detail.variant);

			if (variant) {
				let stock = variant.getStock(warehouse);

				const ID = (obj) => typeof obj === "string" ? obj.toString() : obj._id.toString();

				if (stock) {
					let stockBefore = stocksBefore.find((s) => ID(s.product) === ID(detail.product) && ID(s.variant) === ID(detail.variant) && ID(s.warehouse) === ID(warehouse));

					if (stockBefore) continue;

					let _stock = {
						product: { _id: product._id, name: product.name },
						variant: { _id: variant._id, name: variant.name },
						warehouse: { _id: warehouseDoc._id, name: warehouseDoc.name },
						stock: stock.quantity,
						unitName: product.unit.name
					};

					stocksBefore.push(_stock);
				}
			}
		}
	};
	/* ===================================================================================================================== */

	let productsUpdated = [];

	// if purchase status effected, update stock
	if (purchase.status && purchase.status.effected) {
		for (let detail of purchase.details) {
			// TODO:: handle if product is not found, mybe this is a bug will not happen because we don't allow to delete products
			let productUpdated = productsUpdated.find((p) => p._id.toString() === detail.product._id.toString());

			let product = productUpdated || detail.product;

			product.subtractFromStock({ warehouse: purchase.warehouse._id, quantity: detail.stock, variant: detail.variant });

			if (!productUpdated) productsUpdated.push(product);
		}
	}

	// update purchase and details
	purchase.fill(req.body).addDetails(details);

	// // get subUnits for new details and check units and variants
	await purchase.populate("details.subUnit", "_id operator value base");

	for (let detail of purchase.details) {
		throwIfNotValidDetail(detail, products);
	}

	// if purchase status effected, update stock
	if (statusDoc.effected) {
		for (let detail of purchase.details) {
			let product = products.find((p) => p._id.toString() === detail.product.toString());

			let updatedProduct = productsUpdated.find((p) => p._id.toString() === product._id.toString());

			product = updatedProduct || product;

			let quantity = detail.stock; // detail.stock is the new quantity to add to stock getted from detail schema (not from request)

			product.addToStock({ warehouse, quantity, variant: detail.variant });

			if (!updatedProduct) productsUpdated.push(product);
		}
	}

	let errors = [];

	if (productsUpdated.length > 0) {
		for (let productStock of stocksBefore) {
			let product = productsUpdated.find((p) => p._id.toString() === productStock.product._id.toString());

			let quantity = product.getVariantById(productStock.variant._id).getStock(productStock.warehouse._id).quantity;

			if (quantity < 0) {
				errors.push({
					productName: productStock.product.name,
					variantName: productStock.variant.name,
					warehouseName: productStock.warehouse.name,
					stockBefore: productStock.stock,
					stockAfter: quantity,
					unitName: productStock.unitName
				});
			}
		}
	}

	if (errors.length > 0) throw createError({ type: "quantity", errors }, 422);

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([purchase.save({ session }), ...productsUpdated.map((product) => product.save({ session }))]);

		await session.commitTransaction();

		res.json({ _id: purchase._id });
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.changePurchaseStatus = async (req, res) => {
	const { status } = req.body;

	// get product in detail to update stock
	let purchase = await Purchase.findById(req.params.id)
		.populate("details.subUnit", "operator value")
		.populate("details.unit", "name")
		.populate("details.product", "name variants._id variants.stock variants.name")
		.populate("status", "effected");

	if (!purchase) throw notFound();

	// this is fix thius error ------> ** Can't save() the same doc multiple times in parallel.
	// because maybe the same product is in the details array more than one time with different variant
	let updates = [];

	let errors = [];

	for (let detail of purchase.details) {
		let product = updates.find((p) => p._id.toString() === detail.product._id.toString());

		let updatedProduct = product || detail.product;

		// get real stock before any operation
		let variant = detail.product.getVariantById(detail.variant);

		let stockBefore = 0;

		if (variant) {
			let stock = variant.getStock(purchase.warehouse);

			stockBefore = (stock && stock.quantity) || stockBefore;
		}

		if (purchase.status && purchase.status.effected) {
			detail.product.subtractFromStock({ warehouse: purchase.warehouse, quantity: detail.stock, variant: detail.variant });
		}

		if (status.effected) {
			detail.product.addToStock({ warehouse: purchase.warehouse, quantity: detail.stock, variant: detail.variant });
		}

		// check stock if less than 0
		if (variant) {
			let stock = variant.getStock(purchase.warehouse);

			let stockAfter = (stock && stock.quantity) || 0; // this because maybe variant doesn't have a stock

			if (stockAfter < 0) {
				let error = { variantName: variant.name, productName: detail.product.name, unitName: detail.unit.name, stockAfter, stockBefore };

				errors.push(error);
			}
		}

		if (!product) updates.push(updatedProduct);
	}

	if (errors.length > 0) throw createError({ type: "quantity", errors }, 422);

	purchase.status = status._id;

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		// MongoServerError: Transaction numbers are only allowed on a replica set member or mongos
		// https://stackoverflow.com/questions/51461952/mongodb-v4-0-transaction-mongoerror-transaction-numbers-are-only-allowed-on-a
		await Promise.all([purchase.save({ session }), ...updates.map((p) => p.save({ session }))]);

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
	let { id } = req.params;

	let purchase = await Purchase.findById(id, "paid status").populate("status", "effected");

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

let throwIfNotValidDetail = (detail, products) => {
	let { product, variant, subUnit, unit } = detail;

	let e = (field, type = "notFound") => {
		return createError({ field: `details.${field}`, type, product, variant }, 422);
	};

	product = products.find((p) => p._id.toString() === product.toString());

	if (!product) throw e("product");

	if (!product.availableForPurchase) throw e("product");

	if (detail.unit) { // in update we get unit with detail so we don't need to set it again from product
		unit = detail.unit._id || detail.unit;
	} else {
		unit = detail.unit = (product.unit._id || product.unit);
	}

	variant = product.getVariantById(detail.variant);

	if (!variant) throw e("variant", "notFound");

	if (!variant.availableForPurchase) throw e("variant", "notAvailable");

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
// 		query.$or.push({ _id: detail.product, "variants._id": detail.variant, availableForPurchase: true });
// 	}

// 	let variantsIds = details.map((detail) => detail.variant);

// 	let products = await Product.find(query, { _id: 1, variants: { $elemMatch: { _id: { $in: variantsIds } } } })
// 		.populate({
// 			path: "unit",
// 			select: { _id: 1, value: 1, operator: 1 },
// 		})
// 		.populate({
// 			path: "purchaseUnit",
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
