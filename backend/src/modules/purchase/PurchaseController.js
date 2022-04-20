const mongoose = require("mongoose");

const { createError, notFound } = require("../../errors/ErrorHandler");

const Invoice = require("../invoice/Invoice");

const Product = require("../product/Product");

const Purchase = require("./Purchase");

exports.getPurchases = async (req, res) => {
	// let { sort, skip, limit } = handleQueries(req, Purchase);

	let select = "date reference supplier warehouse status total paid paymentStatus";

	let query = Purchase.find({}, select)
		.withPagination(req.query)
		.withSearch(req.query)
		.populate("supplier warehouse", "name");

	let counts = Purchase.count().withSearch(req.query);

	let invoiceQuery = Invoice.findOne({ name: "purchases" }, "-_id statuses._id statuses.name statuses.color");

	let [docs, total, invoice] = await Promise.all([query, counts, invoiceQuery]);

	docs.forEach((doc) => {
		doc._doc.status = invoice.statuses.find((s) => s._id.toString() === doc.status._id.toString());

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

	for (let detail of purchase.details) {
		let product = throwIfNotValidDetail(detail, products);

		if (statusDoc.effected) {
			let quantity = detail.stock;

			product.addToStock({ warehouse, quantity, variant: detail.variant });
		}
	}

	let updates = [];

	if (statusDoc.effected) {
		updates = products.map((p) => p.save());
	}

	try {
		await Promise.all([purchase.save(), ...updates]);

		await session.commitTransaction();

		res.json({});
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.getEditPurchase = async (req, res) => {
	let { id } = req.params;

	let select = "_id date warehouse supplier shipping tax discount discountMethod status reference details notes";

	let purchase = await Purchase.findById(id, select).populate("details.product", "variants._id variants.name variants.images variants.stock code name image");

	let details = [];

	purchase.details.forEach(detail => {
		let _detail = {
			amount: detail.amount,
			quantity: detail.quantity,
			tax: detail.tax,
			taxMethod: detail.taxMethod,
			discount: detail.discount,
			discountMethod: detail.discountMethod,
			unit: detail.unit,
			subUnit: detail.subUnit,
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
	let { details, warehouse, statusDoc, statuses } = req.body;

	// get product in detail to update stock if status effected
	let purchaseQuery = Purchase.findById(req.params.id).populate("details.subUnit", "_id operator value").populate("details.product", "_id variants._id variants.stock");

	let productIds = details.map((detail) => detail.product);

	// get products for new details
	let productsQuery = Product.find({ _id: { $in: productIds } }, "_id availableForPurchase unit variants._id variants.availableForPurchase variants.stock");

	let [purchase, products] = await Promise.all([purchaseQuery, productsQuery]);

	if (!purchase) throw notFound();

	let oldStatus = purchase.status._id && statuses.find((s) => s._id.toString() === purchase.status._id.toString());

	let productsUpdated = [];

	// if purchase status effected, update stock
	if (oldStatus && oldStatus.effected) {
		for (let detail of purchase.details) {
			// TODO:: handle if product is not found, mybe this is a bug will not happen because we don't allow to delete products
			let productUpdated = productsUpdated.find((p) => p._id.toString() === detail.product._id.toString());

			let product = productUpdated || detail.product;

			product.subtractFromStock({ warehouse: purchase.warehouse, quantity: detail.stock, variant: detail.variant });

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

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([purchase.save(), ...productsUpdated.map((p) => p.save())]);

		await session.commitTransaction();

		res.json({});
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

let throwIfNotValidDetail = (detail, products) => {
	let { product, variant, subUnit, unit } = detail;

	let e = (field, type = "notFound") => {
		return createError({ field: `details.${field}`, type, product, variant }, 422);
	};

	product = products.find((p) => p._id.toString() === product.toString());

	if (!product) throw e("product");

	if (!product.availableForPurchase) throw e("product");

	unit = detail.unit = product.unit;

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
