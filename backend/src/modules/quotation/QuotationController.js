const { createError, notFound } = require("../../errors/ErrorHandler");

const Product = require("../product/Product");

const Status = require("../status/Status");

const Warehouse = require("../warehouse/Warehouse");

const Customer = require("../customer/Customer");

const Quotation = require("./Quotation");

exports.getQuotations = async (req, res) => {
	let select = "date reference customer warehouse status total paid paymentStatus";

	let filterOptions = { query: req.query, filterationFields: ["date", "customer", "warehouse", "status"] };

	let paymentStatus = req.query.paymentStatus;

	let queries = { paid: "this.total === this.paid", unpaid: "this.paid === 0", partial: "this.paid < this.total && this.paid != 0" }

	paymentStatus = (Object.keys(queries).includes(paymentStatus) && { $where: queries[paymentStatus] } || {});

	let query = Quotation.find(paymentStatus, select)
		.withPagination(req.query)
		.withSearch(req.query)
		.withFilter(filterOptions)
		.populate("customer warehouse", "name")
		.populate("status", "name color");

	let counts = Quotation.count().withSearch(req.query).withFilter(filterOptions);

	let [docs, total] = await Promise.all([query, counts]);

	docs.forEach((doc) => {
		doc._doc.paymentStatus = doc.paymentStatus;
	});

	res.json({ docs, total });
};

exports.createQuotation = async (req, res) => {
	let { details, warehouse: warehouseId, status: statusId } = req.body;

	let quotation = new Quotation().fill(req.body).addDetails(details).by(req.me._id);

	let productDocs = Product.find({ _id: { $in: details.map((detail) => detail.product) } }, "name availableForSale unit variants._id variants.availableForSale");

	let statusQuery = Status.findOne({ _id: statusId, invoice: "sales" }, "_id");

	let warehouseQuery = Warehouse.findById(warehouseId, "_id");

	let customerQuery = Customer.findById(req.body.customer, "_id");

	let [products, status, warehouse, customer] = await Promise.all([productDocs, statusQuery, warehouseQuery, customerQuery, quotation.populate("details.subUnit", "base")]);

	if (!status) throw notFound("status", 422);

	if (!warehouse) throw notFound("warehouse", 422);

	if (!customer) throw notFound("customer", 422);

	for (let detail of quotation.details) {
		throwIfNotValidDetail(detail, products);
	}

	await quotation.save()

	res.json({ _id: quotation._id });
};

exports.getQuotation = async (req, res) => {
	let quotation = await Quotation.findById(req.params.id, "tax discount discountMethod shipping paid date details createdBy status customer warehouse total reference createdAt payments")
		.populate("customer", "name email phone zipCode address city country")
		.populate("warehouse", "name email phone zipCode address city country")
		.populate("details.subUnit", "name")
		.populate("details.product", "name code variants._id variants.name")
		.populate("status", "name color")
		.populate("createdBy", "fullname");

	if (!quotation) throw notFound();

	let details = quotation.details.map((detail) => {
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
			variantName: detail.product.getVariantById(detail.variant).name
		};
	});

	res.json({ doc: { ...quotation.toJSON(), details } });
}

exports.getEditQuotation = async (req, res) => {
	let { id } = req.params;

	let select = "date warehouse customer shipping tax discount discountMethod status reference details notes";

	let quotation = await Quotation.findById(id, select).populate("details.product", "price variants._id variants.name variants.images variants.stock code name image").populate("details.subUnit", "value operator");

	if (!quotation) throw notFound();

	let details = quotation.details.map(detail => {
		let variant = detail.product.getVariantById(detail.variant);
		return {
			amount: detail.unitAmount,
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
			mainAmount: detail.product.price,
			variantName: variant.name,
			image: variant.defaultImage || detail.product.image,
			stock: variant.getInstockByWarehouse(quotation.warehouse)
		};
	});

	res.json({ doc: { ...quotation.toJSON(), details } });
};

exports.updateQuotation = async (req, res) => {
	let { details, status: statusId, warehouse: warehouseId } = req.body;

	// get product in detail to update stock if status effected
	let quotationQuery = Quotation.findById(req.params.id);

	// get products for new details
	let productsQuery = Product.find({ _id: { $in: details.map((detail) => detail.product) } }, "name availableForSale unit variants._id variants.availableForSale");

	let statusQuery = Status.findOne({ _id: statusId, invoice: "sales" }, "_id");

	let warehouseQuery = Warehouse.findById(warehouseId, "_id");

	let customerQuery = Customer.findById(req.body.customer, "_id");

	let [quotation, products, status, warehouse, customer] = await Promise.all([quotationQuery, productsQuery, statusQuery, warehouseQuery, customerQuery]);

	if (!quotation) throw notFound();

	if (!status) throw notFound("status", 422);

	if (!warehouse) throw notFound("warehouse", 422);

	if (!customer) throw notFound("customer", 422);

	// update quotation and details
	quotation.fill(req.body).addDetails(details).by(req.me._id);

	// // get subUnits for new details and check units and variants
	await quotation.populate("details.subUnit", "base");

	for (let detail of quotation.details) {
		throwIfNotValidDetail(detail, products);
	}

	await quotation.save();

	res.json({ _id: quotation._id });
};

exports.changeQuotationStatus = async (req, res) => {
	const { statusId } = req.body;

	let quotationQuery = Quotation.findById(req.params.id, "status");

	let statusQuery = Status.findOne({ _id: statusId, invoice: "sales" }, "_id");

	let [quotation, status] = await Promise.all([quotationQuery, statusQuery]);

	if (!quotation) throw notFound();

	if (!status) throw notFound("status", 422);

	quotation.status = status._id;

	await quotation.by(req.me._id).save();

	res.json({});
};

exports.deleteQuotation = async (req, res) => {
	let { id } = req.params;

	let quotation = await Quotation.findById(id, "deletedAt deletedBy");

	if (!quotation) throw notFound();

	await quotation.deleteBy(req.me._id);;

	res.json({});
};

exports.getPayments = async (req, res) => {
	let quotation = await Quotation.findById(req.params.id, "payments");

	if (!quotation) throw notFound();

	res.json({ payments: quotation.payments });
};

exports.createPayment = async (req, res) => {
	let quotation = await Quotation.findById(req.params.id);

	if (!quotation) throw notFound();

	quotation.addPayment({ ...req.body, createdBy: req.me._id });

	await quotation.save();

	res.json({});
}

exports.updatePayment = async (req, res) => {
	let quotation = await Quotation.findById(req.params.id);

	if (!quotation) throw notFound();

	quotation.editPayment(req.params.paymentId, { ...req.body, updatedBy: req.me._id });

	await quotation.save();

	res.json({});
}

exports.deletePayment = async (req, res) => {
	let quotation = await Quotation.findById(req.params.id);

	if (!quotation) throw notFound();

	quotation.deletePayment(req.params.paymentId);

	await quotation.save();

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

	if (detail.unit) { // in update we get unit with detail so we don't need to set it again from product
		unit = detail.unit;
	} else {
		unit = detail.unit = product.unit;
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
