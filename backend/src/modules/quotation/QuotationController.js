const { createError, notFound } = require("../../errors/ErrorHandler");

const Status = require("../status/Status");

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
	let quotation = new Quotation().fill(req.body).addDetails(req.body.details).by(req.me._id);

	await quotation.populate("customer warehouse status details.subUnit details.variant details.product");

	if (!quotation.customer || quotation.customer.deletedAt != null) throw notFound("customer", 422);

	if (!quotation.warehouse || quotation.warehouse.deletedAt != null) throw notFound("warehouse", 422);

	if (!quotation.status || quotation.status.deletedAt != null) throw notFound("status", 422);

	for (let index in quotation.details) {
		let detail = quotation.details[index];

		if (!detail.subUnit || detail.subUnit.deletedAt != null) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		if (!detail.product || detail.product.deletedAt != null) throw createError({ field: `details[${index}].product`, type: "notFound" }, 422);

		if (!detail.variant || detail.variant.deletedAt != null) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		let isVariantRelatedWithProduct = detail.product.variants.includes(detail.variant._id.toString());

		if (!isVariantRelatedWithProduct) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		if (!detail.product.availableForSale) throw createError({ field: `details[${index}].product`, type: "notAvailable" }, 422);

		if (!detail.variant.availableForSale) throw createError({ field: `details[${index}].variant`, type: "notAvailable" }, 422);

		let subUnitIsMainUnit = detail.subUnit._id.toString() == detail.product.unit.toString();

		if (!subUnitIsMainUnit && detail.subUnit.base.toString() !== detail.product.unit.toString()) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		detail.unit = detail.product.unit;
	}

	await quotation.save()

	res.json({ _id: quotation._id });
};

exports.getQuotation = async (req, res) => {
	let quotation = await Quotation.findById(req.params.id, "tax discount discountMethod shipping paid date details createdBy status customer warehouse total reference createdAt payments")
		.populate("customer", "name email phone zipCode address city country")
		.populate("warehouse", "name email phone zipCode address city country")
		.populate("details.subUnit", "name")
		.populate("details.product", "name code")
		.populate("details.variant", "name")
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
			variantId: detail.variant._id,
			total: detail.total,
			subUnit: detail.subUnit,
			product: detail.product._id,
			name: detail.product.name,
			code: detail.product.code,
			variantName: detail.variant.name
		};
	});

	res.json({ doc: { ...quotation.toJSON(), details } });
}

exports.getEditQuotation = async (req, res) => {
	let select = "date warehouse customer shipping tax discount discountMethod status reference details notes";

	let quotation = await Quotation.findById(req.params.id, select).populate("details.product", "price code name image").populate("details.product", "name images stocks").populate("details.subUnit", "value operator");

	if (!quotation) throw notFound();

	let details = quotation.details.map(detail => {
		return {
			amount: detail.unitAmount,
			quantity: detail.quantity,
			tax: detail.tax,
			taxMethod: detail.taxMethod,
			discount: detail.discount,
			discountMethod: detail.discountMethod,
			unit: detail.unit,
			subUnit: detail.subUnit._id,
			variantId: detail.variant._id,
			product: detail.product._id,
			name: detail.product.name,
			code: detail.product.code,
			mainAmount: detail.product.price,
			variantName: detail.variant.name,
			image: detail.variant.defaultImage || detail.product.image,
			stock: detail.variant.getInstockByWarehouse(quotation.warehouse)
		};
	});

	res.json({ doc: { ...quotation.toJSON(), details } });
};

exports.updateQuotation = async (req, res) => {
	let oldQuotationQuery = Quotation.findById(req.params.id).populate("status warehouse details.variant details.product details.subUnit details.unit");

	let quotation = new Quotation().fill(req.body).addDetails(req.body.details);

	let [oldQuotation] = await Promise.all([oldQuotationQuery, quotation.populate("customer status warehouse details.variant details.product details.subUnit")]);

	if (!oldQuotation) throw notFound();

	if (!quotation.customer || quotation.customer.deletedAt != null) throw notFound("customer", 422);

	if (!quotation.warehouse || quotation.warehouse.deletedAt != null) throw notFound("warehouse", 422);

	if (!quotation.status || quotation.status.deletedAt != null) throw notFound("status", 422);

	for (let index in quotation.details) {
		let detail = quotation.details[index];

		if (!detail.subUnit || detail.subUnit.deletedAt != null) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		if (!detail.product || detail.product.deletedAt != null) throw createError({ field: `details[${index}].product`, type: "notFound" }, 422);

		if (!detail.variant || detail.variant.deletedAt != null) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		let isVariantRelatedWithProduct = detail.product.variants.includes(detail.variant._id.toString());

		if (!isVariantRelatedWithProduct) throw createError({ field: `details[${index}].variant`, type: "notFound" }, 422);

		if (!detail.product.availableForSale) throw createError({ field: `details[${index}].product`, type: "notAvailable" }, 422);

		if (!detail.variant.availableForSale) throw createError({ field: `details[${index}].variant`, type: "notAvailable" }, 422);

		let subUnitIsMainUnit = detail.subUnit._id.toString() == detail.product.unit.toString();

		if (!subUnitIsMainUnit && detail.subUnit.base.toString() !== detail.product.unit.toString()) throw createError({ field: `details[${index}].subUnit`, type: "notFound" }, 422);

		detail.unit = detail.product.unit;
	}

	oldQuotation.fill(req.body).addDetails(quotation.details).by(req.me._id);

	await oldQuotation.save();

	res.json({ _id: oldQuotation._id });
};

exports.changeQuotationStatus = async (req, res) => {
	let quotationQuery = Quotation.findById(req.params.id, "status");

	let statusQuery = Status.findOne({ invoice: "sales", _id: req.body.statusId });

	let [quotation, status] = await Promise.all([quotationQuery, statusQuery]);

	if (!quotation) throw notFound();

	if (!status) throw notFound("status", 422);

	quotation.status = status._id;

	await quotation.by(req.me._id).save();

	res.json({});
};

exports.deleteQuotation = async (req, res) => {
	let quotation = await Quotation.findById(req.params.id, "deletedAt deletedBy");

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
