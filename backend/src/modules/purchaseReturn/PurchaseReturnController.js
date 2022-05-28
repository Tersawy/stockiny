const mongoose = require("mongoose");

const { createError, notFound } = require("../../errors/ErrorHandler");

const Product = require("../product/Product");

const PurchaseReturn = require("./PurchaseReturn");

exports.getPurchasesReturn = async (req, res) => {
	let select = "date reference supplier warehouse status total paid paymentStatus";

	let filterOptions = { query: req.query, filterationFields: ["date", "supplier", "warehouse", "status"] };

	let paymentStatus = req.query.paymentStatus;

	let queries = { paid: "this.total === this.paid", unpaid: "this.paid === 0", partial: "this.paid < this.total && this.paid != 0" }

	paymentStatus = (Object.keys(queries).includes(paymentStatus) && { $where: queries[paymentStatus] } || {});

	let query = PurchaseReturn.find(paymentStatus, select)
		.withPagination(req.query)
		.withSearch(req.query)
		.withFilter(filterOptions)
		.populate("supplier warehouse", "name")
		.populate("status", "name color");

	let counts = PurchaseReturn.count().withSearch(req.query).withFilter(filterOptions);

	let [docs, total] = await Promise.all([query, counts]);

	docs.forEach((doc) => {
		doc._doc.paymentStatus = doc.paymentStatus;
	});

	res.json({ docs, total });
};

exports.createPurchaseReturn = async (req, res) => {
	let { details, warehouse, statusDoc } = req.body;

	let purchaseReturnDoc = new PurchaseReturn().fill(req.body).addDetails(details).by(req.me._id);

	let productSelect = "name availableForPurchaseReturn unit variants._id variants.availableForPurchaseReturn variants.stock variants.name";

	let productIds = details.map((detail) => detail.product);

	let productDocs = Product.find({ _id: { $in: productIds } }, productSelect).populate("unit", "name");

	purchaseReturnDoc = purchaseReturnDoc.populate("details.subUnit", "_id value operator base");

	let [products, purchaseReturn] = await Promise.all([productDocs, purchaseReturnDoc]);

	let session = await mongoose.startSession();

	session.startTransaction();

	// This fix => ParallelSaveError: Can't save() the same doc multiple times in parallel
	let productsUpdated = [];

	let errors = [];

	for (let detail of purchaseReturn.details) {
		let product = throwIfNotValidDetail(detail, products);

		// TODO:: handle if product is not found, mybe this is a bug will not happen because we don't allow to delete products
		let updatedProduct = productsUpdated.find((p) => p._id.toString() === detail.product._id.toString());

		product = updatedProduct || product;

		// get stock of product before update
		let stock = product.getVariantById(detail.variant).getStock(warehouse);

		let stockBefore = (stock && stock.quantity) || 0;

		if (statusDoc.effected) {
			let quantity = detail.stock;

			product.subtractFromStock({ warehouse, quantity, variant: detail.variant });

			if (!updatedProduct) productsUpdated.push(product);

			let variant = product.getVariantById(detail.variant);

			if (variant) {
				let stock = variant.getStock(warehouse);

				if (stock) {
					if (stock.quantity < 0) {
						errors.push({
							productName: product.name,
							variantName: variant.name,
							stockBefore,
							stockAfter: stock.quantity,
							unitName: product.unit.name
						});
					}
				}
			}
		}
	}

	if (errors.length) throw createError({ type: "quantity", errors }, 422);

	try {
		await Promise.all([purchaseReturn.save({ session }), ...productsUpdated.map((product) => product.save({ session }))]);

		await session.commitTransaction();

		res.json({ _id: purchaseReturn._id });
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.getPurchaseReturn = async (req, res) => {
	let purchaseReturn = await PurchaseReturn.findById(req.params.id, "_id tax discount discountMethod shipping paid date details createdBy status supplier warehouse total reference createdAt")
		.populate("supplier", "_id name email phone zipCode address city country")
		.populate("warehouse", "_id name email phone zipCode address city country")
		.populate("details.subUnit", "_id name")
		.populate("details.product", "_id name code variants._id variants.name")
		.populate("status", "_id name color")
		.populate("createdBy", "_id fullname");

	if (!purchaseReturn) throw notFound();

	let details = purchaseReturn.details.map((detail) => {

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


	purchaseReturn = purchaseReturn.toJSON();

	res.json({ doc: { ...purchaseReturn, details } });
}

exports.getEditPurchaseReturn = async (req, res) => {
	let { id } = req.params;

	let select = "date warehouse supplier shipping tax discount discountMethod status reference details notes";

	let purchaseReturn = await PurchaseReturn.findById(id, select).populate("details.product", "variants._id variants.name variants.images variants.stock code name image").populate("details.subUnit", "value operator");

	if (!purchaseReturn) throw notFound();

	let details = [];

	purchaseReturn.details.forEach(detail => {
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

				let stock = variant.getStock(purchaseReturn.warehouse);

				_detail.stock = stock ? stock.quantity : 0;
			}
		}

		details.push(_detail);
	});

	res.json({ doc: { ...purchaseReturn._doc, details } });
};

exports.updatePurchaseReturn = async (req, res) => {
	let { details, warehouse, statusDoc, warehouseDoc } = req.body;

	// get product in detail to update stock if status effected
	let purchaseReturnQuery = PurchaseReturn.findById(req.params.id)
		.populate("details.subUnit", "operator value")
		.populate("details.unit", "name")
		.populate("details.product", "name variants._id variants.stock variants.name")
		.populate("status", "effected")
		.populate("warehouse", "name");


	let productIds = details.map((detail) => detail.product);

	// get products for new details
	let productsQuery = Product.find({ _id: { $in: productIds } }, "name availableForPurchaseReturn unit variants._id variants.availableForPurchaseReturn variants.stock variants.name").populate("unit", "name");

	let [purchaseReturn, products] = await Promise.all([purchaseReturnQuery, productsQuery]);

	if (!purchaseReturn) throw notFound();

	/* ================================================= Get Initial Stock ================================================= */
	// get initial stock to send stock before update in errors if final stock is less than 0 after save
	let stocksBefore = [];

	for (let detail of purchaseReturn.details) {
		let variant = detail.product.getVariantById(detail.variant);

		if (variant) {
			let stock = variant.getStock(purchaseReturn.warehouse);

			if (stock) {
				let _stock = {
					product: { _id: detail.product._id, name: detail.product.name },
					variant: { _id: detail.variant._id, name: detail.variant.name },
					warehouse: { _id: purchaseReturn.warehouse._id, name: purchaseReturn.warehouse.name },
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

	// if purchaseReturn status effected, update stock
	if (purchaseReturn.status && purchaseReturn.status.effected) {
		for (let detail of purchaseReturn.details) {
			// TODO:: handle if product is not found, mybe this is a bug will not happen because we don't allow to delete products
			let productUpdated = productsUpdated.find((p) => p._id.toString() === detail.product._id.toString());

			let product = productUpdated || detail.product;

			product.addToStock({ warehouse: purchaseReturn.warehouse._id, quantity: detail.stock, variant: detail.variant });

			if (!productUpdated) productsUpdated.push(product);
		}
	}

	// update purchaseReturn and details
	purchaseReturn.fill(req.body).addDetails(details);

	// // get subUnits for new details and check units and variants
	await purchaseReturn.populate("details.subUnit", "operator value base");

	for (let detail of purchaseReturn.details) {
		throwIfNotValidDetail(detail, products);
	}

	// if purchaseReturn status effected, update stock
	if (statusDoc.effected) {
		for (let detail of purchaseReturn.details) {
			let product = products.find((p) => p._id.toString() === detail.product.toString());

			let updatedProduct = productsUpdated.find((p) => p._id.toString() === product._id.toString());

			product = updatedProduct || product;

			let quantity = detail.stock; // detail.stock is the new quantity to add to stock getted from detail schema (not from request)

			product.subtractFromStock({ warehouse, quantity, variant: detail.variant });

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
		await Promise.all([purchaseReturn.save({ session }), ...productsUpdated.map((product) => product.save({ session }))]);

		await session.commitTransaction();

		res.json({ _id: purchaseReturn._id });
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.changePurchaseReturnStatus = async (req, res) => {
	const { status } = req.body;

	// get product in detail to update stock
	let purchaseReturn = await PurchaseReturn.findById(req.params.id)
		.populate("details.subUnit", "operator value")
		.populate("details.unit", "name")
		.populate("details.product", "name variants._id variants.stock variants.name")
		.populate("status", "effected");

	if (!purchaseReturn) throw notFound();

	// this is fix thius error ------> ** Can't save() the same doc multiple times in parallel.
	// because maybe the same product is in the details array more than one time with different variant
	let updates = [];

	let errors = [];

	for (let detail of purchaseReturn.details) {
		let product = updates.find((p) => p._id.toString() === detail.product._id.toString());

		let updatedProduct = product || detail.product;

		// get real stock before any operation
		let variant = detail.product.getVariantById(detail.variant);

		let stockBefore = 0;

		if (variant) {
			let stock = variant.getStock(purchaseReturn.warehouse);

			stockBefore = (stock && stock.quantity) || stockBefore;
		}

		if (purchaseReturn.status && purchaseReturn.status.effected) {
			detail.product.addToStock({ warehouse: purchaseReturn.warehouse, quantity: detail.stock, variant: detail.variant });
		}

		if (status.effected) {
			detail.product.subtractFromStock({ warehouse: purchaseReturn.warehouse, quantity: detail.stock, variant: detail.variant });
		}

		// check stock if less than 0
		if (variant) {
			let stock = variant.getStock(purchaseReturn.warehouse);

			let stockAfter = (stock && stock.quantity) || 0; // this because maybe variant doesn't have a stock

			if (stockAfter < 0) {
				let error = { variantName: variant.name, productName: detail.product.name, unitName: detail.unit.name, stockAfter, stockBefore };

				errors.push(error);
			}
		}

		if (!product) updates.push(updatedProduct);
	}

	if (errors.length > 0) throw createError({ type: "quantity", errors }, 422);

	purchaseReturn.status = status._id;

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		// MongoServerError: Transaction numbers are only allowed on a replica set member or mongos
		// https://stackoverflow.com/questions/51461952/mongodb-v4-0-transaction-mongoerror-transaction-numbers-are-only-allowed-on-a
		await Promise.all([purchaseReturn.save({ session }), ...updates.map((p) => p.save({ session }))]);

		await session.commitTransaction();

		res.json({});
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.deletePurchaseReturn = async (req, res) => {
	let { id } = req.params;

	let purchaseReturn = await PurchaseReturn.findById(id, "paid status").populate("status", "effected");

	if (!purchaseReturn) throw notFound();

	if (purchaseReturn.paid) throw createError("paid", 400);

	if (purchaseReturn.status && purchaseReturn.status.effected) {
		throw createError("effected", 400);
	}

	await purchaseReturn.deleteBy(req.me._id);;

	res.json({});
};

exports.getPayments = async (req, res) => {
	let purchaseReturn = await PurchaseReturn.findById(req.params.id, "payments");

	if (!purchaseReturn) throw notFound();

	res.json({ payments: purchaseReturn.payments });
};

exports.createPayment = async (req, res) => {
	let purchaseReturn = await PurchaseReturn.findById(req.params.id);

	if (!purchaseReturn) throw notFound();

	purchaseReturn.addPayment({ ...req.body, createdBy: req.me._id });

	await purchaseReturn.save();

	res.json({});
}

exports.updatePayment = async (req, res) => {
	let purchaseReturn = await PurchaseReturn.findById(req.params.id);

	if (!purchaseReturn) throw notFound();

	purchaseReturn.editPayment(req.params.paymentId, { ...req.body, updatedBy: req.me._id });

	await purchaseReturn.save();

	res.json({});
}

exports.deletePayment = async (req, res) => {
	let purchaseReturn = await PurchaseReturn.findById(req.params.id);

	if (!purchaseReturn) throw notFound();

	purchaseReturn.deletePayment(req.params.paymentId);

	await purchaseReturn.save();

	res.json({});
}

let throwIfNotValidDetail = (detail, products) => {
	let { product, variant, subUnit, unit } = detail;

	let e = (field, type = "notFound") => {
		return createError({ field: `details.${field}`, type, product, variant }, 422);
	};

	product = products.find((p) => p._id.toString() === product.toString());

	if (!product) throw e("product");

	if (!product.availableForPurchaseReturn) throw e("product");

	if (detail.unit) { // in update we get unit with detail so we don't need to set it again from product
		unit = detail.unit._id || detail.unit;
	} else {
		unit = detail.unit = (product.unit._id || product.unit);
	}

	variant = product.getVariantById(detail.variant);

	if (!variant) throw e("variant", "notFound");

	if (!variant.availableForPurchaseReturn) throw e("variant", "notAvailable");

	let mainUnitId = unit.toString();

	let subUnitId = subUnit._id && subUnit._id.toString();

	if (!mainUnitId) throw e("unit", "notFound");

	if (!subUnitId) throw e("subUnit", "notFound");

	let subUnitDoNotMatchProductUnits = subUnitId !== mainUnitId && subUnit.base.toString() !== mainUnitId;

	if (subUnitDoNotMatchProductUnits) throw e("subUnit", "notMatch");

	return product;
};
