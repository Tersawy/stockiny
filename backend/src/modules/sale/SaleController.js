const mongoose = require("mongoose");

const { createError, notFound } = require("../../errors/ErrorHandler");

const Product = require("../product/Product");

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
	let { details, warehouse, statusDoc } = req.body;

	let saleDoc = new Sale().fill(req.body).addDetails(details).by(req.me._id);

	let productSelect = "name availableForSale unit variants._id variants.availableForSale variants.stock variants.name";

	let productIds = details.map((detail) => detail.product);

	let productDocs = Product.find({ _id: { $in: productIds } }, productSelect).populate("unit", "name");

	// ! we can't get unit with new populate because it will be get from product
	saleDoc = saleDoc.populate("details.subUnit", "name value operator base");

	let [products, sale] = await Promise.all([productDocs, saleDoc]);

	let session = await mongoose.startSession();

	session.startTransaction();

	// This fix => ParallelSaveError: Can't save() the same doc multiple times in parallel
	let productsUpdated = [];

	let errors = [];

	for (let detail of sale.details) {
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
							unitName: product.unit.name,
						});
					}
				}
			}
		}
	}

	if (errors.length) throw createError({ type: "quantity", errors }, 422);

	try {
		await Promise.all([sale.save({ session }), ...productsUpdated.map((product) => product.save({ session }))]);

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
	let sale = await Sale.findById(req.params.id, "_id tax discount discountMethod shipping paid date details createdBy status customer warehouse total reference createdAt")
		.populate("customer", "_id name email phone zipCode address city country")
		.populate("warehouse", "_id name email phone zipCode address city country")
		.populate("details.subUnit", "_id name")
		.populate("details.product", "_id name code variants._id variants.name")
		.populate("status", "_id name color")
		.populate("createdBy", "_id fullname");

	if (!sale) throw notFound();

	let details = sale.details.map((detail) => {

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

	sale = sale.toJSON();

	res.json({ doc: { ...sale, details } });
}

exports.getEditSale = async (req, res) => {
	let { id } = req.params;

	let select = "date warehouse customer shipping tax discount discountMethod status reference details notes";

	let sale = await Sale.findById(id, select).populate("details.product", "variants._id variants.name variants.images variants.stock code name image").populate("details.subUnit", "value operator");

	if (!sale) throw notFound();

	let details = [];

	sale.details.forEach(detail => {
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

				let stock = variant.getStock(sale.warehouse);

				_detail.stock = stock ? stock.quantity : 0;
			}
		}

		details.push(_detail);
	});

	sale = sale.toJSON();

	res.json({ doc: { ...sale, details } });
};

exports.updateSale = async (req, res) => {
	let { details, warehouse, statusDoc, warehouseDoc } = req.body;

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

	let [sale, products] = await Promise.all([saleQuery, productsQuery]);

	if (!sale) throw notFound();

	/* ================================================= Get Initial Stock ================================================= */
	// get initial stock to send stock before update in errors if final stock is less than 0 after save
	let stocksBefore = [];

	for (let detail of sale.details) {
		let variant = detail.product.getVariantById(detail.variant);

		if (variant) {
			let stock = variant.getStock(sale.warehouse);

			if (stock) {
				let _stock = {
					product: { _id: detail.product._id, name: detail.product.name },
					variant: { _id: detail.variant._id, name: detail.variant.name },
					warehouse: { _id: sale.warehouse._id, name: sale.warehouse.name },
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

	// if sale status effected, update stock
	if (sale.status && sale.status.effected) {
		for (let detail of sale.details) {
			// TODO:: handle if product is not found, mybe this is a bug will not happen because we don't allow to delete products
			let productUpdated = productsUpdated.find((p) => p._id.toString() === detail.product._id.toString());

			let product = productUpdated || detail.product;

			product.addToStock({ warehouse: sale.warehouse._id, quantity: detail.stock, variant: detail.variant });

			if (!productUpdated) productsUpdated.push(product);
		}
	}

	// update sale and details
	sale.fill(req.body).addDetails(details);

	// // get subUnits for new details and check units and variants
	await sale.populate("details.subUnit", "_id operator value base");

	for (let detail of sale.details) {
		throwIfNotValidDetail(detail, products);
	}

	// if sale status effected, update stock
	if (statusDoc.effected) {
		for (let detail of sale.details) {
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
		await Promise.all([sale.save({ session }), ...productsUpdated.map((product) => product.save({ session }))]);

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
	const { status } = req.body;

	// get product in detail to update stock
	let sale = await Sale.findById(req.params.id)
		.populate("details.subUnit", "operator value")
		.populate("details.unit", "name")
		.populate("details.product", "name variants._id variants.stock variants.name")
		.populate("status", "effected");

	if (!sale) throw notFound();

	// this is fix thius error ------> ** Can't save() the same doc multiple times in parallel.
	// because maybe the same product is in the details array more than one time with different variant
	let updates = [];

	let errors = [];

	for (let detail of sale.details) {
		let product = updates.find((p) => p._id.toString() === detail.product._id.toString());

		let updatedProduct = product || detail.product;

		// get real stock before any operation
		let variant = detail.product.getVariantById(detail.variant);

		let stockBefore = 0;

		if (variant) {
			let stock = variant.getStock(sale.warehouse);

			stockBefore = (stock && stock.quantity) || stockBefore;
		}

		if (sale.status && sale.status.effected) {
			detail.product.addToStock({ warehouse: sale.warehouse, quantity: detail.stock, variant: detail.variant });
		}

		if (status.effected) {
			detail.product.subtractFromStock({ warehouse: sale.warehouse, quantity: detail.stock, variant: detail.variant });
		}

		// check stock if less than 0
		if (variant) {
			let stock = variant.getStock(sale.warehouse);

			let stockAfter = (stock && stock.quantity) || 0; // this because maybe variant doesn't have a stock

			if (stockAfter < 0) {
				let error = { variantName: variant.name, productName: detail.product.name, unitName: detail.unit.name, stockAfter, stockBefore };

				errors.push(error);
			}
		}

		if (!product) updates.push(updatedProduct);
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

	if (!product.availableForSale) throw e("product");

	unit = detail.unit = (product.unit._id || product.unit);

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
