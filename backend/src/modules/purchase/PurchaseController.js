const mongoose = require("mongoose");
const ErrorHandler = require("../../errors/ErrorHandler");

const { createError } = require("../../errors/ErrorHandler");
const errorHandler = require("../../middlewares/errorHandler");

const { handleQueries } = require("../../utils/functions");

const Invoice = require("../invoice/Invoice");

const Product = require("../product/Product");

const Unit = require("../unit/Unit");

const Purchase = require("./Purchase");

exports.getPurchases = async (req, res) => {
	// let { sort, skip, limit } = handleQueries(req, Purchase);

	let select = "date reference supplier warehouse status total paid paymentStatus";

	let query = Purchase.find({}, select)
		.withPagination(req.query)
		.withSearch(req.query)
		.populate("supplier warehouse", "name")
		.populate("status", "name color");

	let counts = Purchase.count().withSearch(req.query);

	let invoiceQuery = Invoice.findOne({ name: "purchases" }, "-_id statuses._id statuses.name statuses.color");

	let [docs, total, invoice] = await Promise.all([query, counts, invoiceQuery]);

	docs.forEach((doc) => {
		doc._doc.status = invoice.statuses.find((s) => s._id.toString() === doc.status._id.toString());

		doc._doc.paymentStatus = doc.paymentStatus;
	});

	res.json({ docs, total });
};

/* 
	details: [{
		product: {
			_id,
			variants: [{ _id, availableForPurchase, stock: { warehouse, quantity } }],
			unit: { _id, value, operator },
		},
		subUnit: { _id, value, operator, base },
	}]
*/
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

		res.json({ doc: purchase });
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		session.endSession();
	}
};

exports.getEdit = async (req, res) => {
	let { id } = req.params;

	let purchase = await Purchase.findById(id).populate("details.product", "warehouse variants");

	res.json({ doc: purchase });
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
