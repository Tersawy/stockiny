const mongoose = require("mongoose");

const { createError, notFound } = require("../../errors/ErrorHandler");

const Product = require("../product/Product");

const SaleReturn = require("./SaleReturn");

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
	let { details, warehouse, statusDoc } = req.body;

	let saleReturnDoc = new SaleReturn().fill(req.body).addDetails(details).by(req.me._id);

	let productSelect = "availableForSaleReturn unit variants._id variants.availableForSaleReturn variants.stock";

	let productIds = details.map((detail) => detail.product);

	let productDocs = Product.find({ _id: { $in: productIds } }, productSelect);

	saleReturnDoc = saleReturnDoc.populate("details.subUnit", "value operator base");

	let [products, saleReturn] = await Promise.all([productDocs, saleReturnDoc]);

	let session = await mongoose.startSession();

	session.startTransaction();

	// This fix => ParallelSaveError: Can't save() the same doc multiple times in parallel
	let productsUpdated = [];

	for (let detail of saleReturn.details) {
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
		await Promise.all([saleReturn.save({ session }), ...productsUpdated.map((product) => product.save({ session }))]);

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


	saleReturn = saleReturn.toJSON();

	res.json({ doc: { ...saleReturn, details } });
}

exports.getEditSaleReturn = async (req, res) => {
	let { id } = req.params;

	let select = "date warehouse customer shipping tax discount discountMethod status reference details notes";

	let saleReturn = await SaleReturn.findById(id, select).populate("details.product", "variants._id variants.name variants.images variants.stock code name image").populate("details.subUnit", "value operator");

	if (!saleReturn) throw notFound();

	let details = [];

	saleReturn.details.forEach(detail => {
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

				let stock = variant.getStock(saleReturn.warehouse);

				_detail.stock = stock ? stock.quantity : 0;
			}
		}

		details.push(_detail);
	});

	res.json({ doc: { ...saleReturn._doc, details } });
};

exports.updateSaleReturn = async (req, res) => {
	let { details, warehouse, statusDoc, warehouseDoc } = req.body;

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

	let [saleReturn, products] = await Promise.all([saleReturnQuery, productsQuery]);

	if (!saleReturn) throw notFound();

	/* ================================================= Get Initial Stock ================================================= */
	// get initial stock to send stock before update in errors if final stock is less than 0 after save
	let stocksBefore = [];

	for (let detail of saleReturn.details) {
		let variant = detail.product.getVariantById(detail.variant);

		if (variant) {
			let stock = variant.getStock(saleReturn.warehouse);

			if (stock) {
				let _stock = {
					product: { _id: detail.product._id, name: detail.product.name },
					variant: { _id: detail.variant._id, name: detail.variant.name },
					warehouse: { _id: saleReturn.warehouse._id, name: saleReturn.warehouse.name },
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

	// if saleReturn status effected, update stock
	if (saleReturn.status && saleReturn.status.effected) {
		for (let detail of saleReturn.details) {
			// TODO:: handle if product is not found, mybe this is a bug will not happen because we don't allow to delete products
			let productUpdated = productsUpdated.find((p) => p._id.toString() === detail.product._id.toString());

			let product = productUpdated || detail.product;

			product.subtractFromStock({ warehouse: saleReturn.warehouse._id, quantity: detail.stock, variant: detail.variant });

			if (!productUpdated) productsUpdated.push(product);
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
	if (statusDoc.effected) {
		for (let detail of saleReturn.details) {
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
		await Promise.all([saleReturn.save({ session }), ...productsUpdated.map((product) => product.save({ session }))]);

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
	const { status } = req.body;

	// get product in detail to update stock
	let saleReturn = await SaleReturn.findById(req.params.id)
		.populate("details.subUnit", "operator value")
		.populate("details.unit", "name")
		.populate("details.product", "name variants._id variants.stock variants.name")
		.populate("status", "effected");

	if (!saleReturn) throw notFound();

	// this is fix thius error ------> ** Can't save() the same doc multiple times in parallel.
	// because maybe the same product is in the details array more than one time with different variant
	let updates = [];

	let errors = [];

	for (let detail of saleReturn.details) {
		let product = updates.find((p) => p._id.toString() === detail.product._id.toString());

		let updatedProduct = product || detail.product;

		// get real stock before any operation
		let variant = detail.product.getVariantById(detail.variant);

		let stockBefore = 0;

		if (variant) {
			let stock = variant.getStock(saleReturn.warehouse);

			stockBefore = (stock && stock.quantity) || stockBefore;
		}

		if (saleReturn.status && saleReturn.status.effected) {
			detail.product.subtractFromStock({ warehouse: saleReturn.warehouse, quantity: detail.stock, variant: detail.variant });
		}

		if (status.effected) {
			detail.product.addToStock({ warehouse: saleReturn.warehouse, quantity: detail.stock, variant: detail.variant });
		}

		// check stock if less than 0
		if (variant) {
			let stock = variant.getStock(saleReturn.warehouse);

			let stockAfter = (stock && stock.quantity) || 0; // this because maybe variant doesn't have a stock

			if (stockAfter < 0) {
				let error = { variantName: variant.name, productName: detail.product.name, unitName: detail.unit.name, stockAfter, stockBefore };

				errors.push(error);
			}
		}

		if (!product) updates.push(updatedProduct);
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

	unit = detail.unit = (product.unit._id || product.unit);

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
