const mongoose = require("mongoose");

const Product = require("./Product");

const fileMove = require("../../services/fileMove");

const { notFound } = require("../../errors/ErrorHandler");

const Variant = require("../variant/Variant");

exports.products = async (req, res) => {
	let select = "name image code category brand unit price cost variants";

	let query = Product.find({}, select)
		.withPagination(req.query)
		.withSearch(req.query)
		.populate("category brand", "name")
		.populate("unit", "name shortName");

	let counts = Product.count().withSearch(req.query);

	let [docs, total] = await Promise.all([query, counts]);

	docs.forEach((doc) => {
		doc._doc.instock = doc.instock;
		delete doc._doc.variants;
	});

	res.json({ docs, total });
};

exports.product = async (req, res) => {
	let select = "name code barcodeType price cost tax taxMethod category brand unit purchaseUnit saleUnit createdAt createdBy updatedAt updatedBy minimumStock image availableForSale availableForSaleReturn availableForPurchase availableForPurchaseReturn notes";

	let product = await Product.findById(req.params.id, select).populate(
		"category brand unit createdBy updatedBy saleUnit purchaseUnit",
		"name username shortName"
	);

	product = product.toJSON();

	if (!product.isUpdated) {
		product.updatedAt = undefined;
		product.updatedBy = undefined;
	}

	res.json({ doc: product });
};

exports.getEdit = async (req, res) => {
	const { id } = req.params;

	let select =
		"name category brand barcodeType code price cost tax taxMethod minimumStock unit purchaseUnit saleUnit notes availableForSale availableForPurchase";

	let product = await Product.findById(id, select);

	res.json({ doc: product });
};

let getPurchaseOptions = async (req, res) => {
	let products = await Product.aggregate([
		{ $match: { deletedAt: null, availableForPurchase: true } },
		{
			$lookup: {
				from: "variants",
				as: "variants",
				let: { productId: "$_id", productImage: "$image" },
				pipeline: [
					{ $match: { $expr: { $and: [{ $eq: ["$product", "$$productId"] }, { $eq: ["$deletedAt", null] }, { $eq: ["$availableForPurchase", true] }] } } },
					{
						$project: {
							name: 1,
							stock: { $arrayElemAt: [{ $filter: { input: "$stocks", as: "stock", cond: { $eq: ["$$stock.warehouse", mongoose.Types.ObjectId(req.query.warehouse)] } } }, 0] },
							image: { $arrayElemAt: [{ $filter: { input: "$images", as: "image", cond: { $eq: ["$$image.default", true] } } }, 0] }
						},
					},
					{ $project: { name: 1, instock: { $ifNull: ["$stock.instock", 0] }, image: { $ifNull: ["$image.name", "$$productImage"] } } }
				]
			}
		},
		{
			$project: {
				_id: 0,
				product: "$_id",
				name: 1,
				code: 1,
				image: 1,
				amount: "$cost",
				unit: 1,
				subUnit: "$purchaseUnit",
				tax: 1,
				taxMethod: 1,
				variants: 1
			},
		},
	]);

	return res.json({ options: products });
};

let getSaleOptions = async (req, res) => {
	let products = await Product.aggregate([
		{ $match: { deletedAt: null, availableForSale: true } },
		{
			$lookup: {
				from: "variants",
				as: "variants",
				let: { productId: "$_id", productImage: "$image" },
				pipeline: [
					{ $match: { $expr: { $and: [{ $eq: ["$product", "$$productId"] }, { $eq: ["$deletedAt", null] }, { $eq: ["$availableForSale", true] }] } } },
					{
						$project: {
							name: 1,
							stock: { $arrayElemAt: [{ $filter: { input: "$stocks", as: "stock", cond: { $and: [{ $eq: ["$$stock.warehouse", mongoose.Types.ObjectId(req.query.warehouse)] }, { $gt: ["$$stock.instock", 0] }] } } }, 0] },
							image: { $arrayElemAt: [{ $filter: { input: "$images", as: "image", cond: { $eq: ["$$image.default", true] } } }, 0] }
						},
					},
					{ $project: { name: 1, instock: { $ifNull: ["$stock.instock", 0] }, image: { $ifNull: ["$image.name", "$$productImage"] } } },
					{ $match: { instock: { $gt: 0 } } }
				]
			}
		},
		{ $match: { $expr: { $gt: [{ $size: "$variants" }, 0] } } },
		{
			$project: {
				_id: 0,
				product: "$_id",
				name: 1,
				code: 1,
				image: 1,
				amount: "$price",
				unit: 1,
				subUnit: "$saleUnit",
				tax: 1,
				taxMethod: 1,
				variants: 1,
			},
		}
	]);

	return res.json({ options: products });
};

let getPurchaseReturnOptions = async (req, res) => {
	let products = await Product.aggregate([
		{ $match: { deletedAt: null, availableForPurchaseReturn: true } },
		{
			$lookup: {
				from: "variants",
				as: "variants",
				let: { productId: "$_id", productImage: "$image" },
				pipeline: [
					{ $match: { $expr: { $and: [{ $eq: ["$product", "$$productId"] }, { $eq: ["$deletedAt", null] }, { $eq: ["$availableForPurchaseReturn", true] }] } } },
					{
						$project: {
							name: 1,
							stock: { $arrayElemAt: [{ $filter: { input: "$stocks", as: "stock", cond: { $and: [{ $eq: ["$$stock.warehouse", mongoose.Types.ObjectId(req.query.warehouse)] }, { $gt: ["$$stock.instock", 0] }] } } }, 0] },
							image: { $arrayElemAt: [{ $filter: { input: "$images", as: "image", cond: { $eq: ["$$image.default", true] } } }, 0] }
						},
					},
					{ $project: { name: 1, instock: { $ifNull: ["$stock.instock", 0] }, image: { $ifNull: ["$image.name", "$$productImage"] } } },
					{ $match: { instock: { $gt: 0 } } }
				]
			}
		},
		{ $match: { $expr: { $gt: [{ $size: "$variants" }, 0] } } },
		{
			$project: {
				_id: 0,
				product: "$_id",
				name: 1,
				code: 1,
				image: 1,
				amount: "$cost",
				unit: 1,
				subUnit: "$purchaseUnit",
				tax: 1,
				taxMethod: 1,
				variants: 1,
			},
		}
	]);

	return res.json({ options: products });
};

let getSaleReturnOptions = async (req, res) => {
	let products = await Product.aggregate([
		{ $match: { deletedAt: null, availableForSaleReturn: true } },
		{
			$lookup: {
				from: "variants",
				as: "variants",
				let: { productId: "$_id", productImage: "$image" },
				pipeline: [
					{ $match: { $expr: { $and: [{ $eq: ["$product", "$$productId"] }, { $eq: ["$deletedAt", null] }, { $eq: ["$availableForSaleReturn", true] }] } } },
					{
						$project: {
							name: 1,
							stock: { $arrayElemAt: [{ $filter: { input: "$stocks", as: "stock", cond: { $eq: ["$$stock.warehouse", mongoose.Types.ObjectId(req.query.warehouse)] } } }, 0] },
							image: { $arrayElemAt: [{ $filter: { input: "$images", as: "image", cond: { $eq: ["$$image.default", true] } } }, 0] }
						},
					},
					{ $project: { name: 1, instock: { $ifNull: ["$stock.instock", 0] }, image: { $ifNull: ["$image.name", "$$productImage"] } } }
				]
			}
		},
		{
			$project: {
				_id: 0,
				product: "$_id",
				name: 1,
				code: 1,
				image: 1,
				amount: "$price",
				unit: 1,
				subUnit: "$saleUnit",
				tax: 1,
				taxMethod: 1,
				variants: 1
			},
		},
	]);

	return res.json({ options: products });
};

let getTransferOptions = async (req, res) => {
	let products = await Product.aggregate([
		{ $match: { deletedAt: null } },
		{
			$lookup: {
				from: "variants",
				as: "variants",
				let: { productId: "$_id", productImage: "$image" },
				pipeline: [
					{ $match: { $expr: { $and: [{ $eq: ["$product", "$$productId"] }, { $eq: ["$deletedAt", null] }] } } },
					{
						$project: {
							name: 1,
							stock: { $arrayElemAt: [{ $filter: { input: "$stocks", as: "stock", cond: { $and: [{ $eq: ["$$stock.warehouse", mongoose.Types.ObjectId(req.query.warehouse)] }, { $gt: ["$$stock.instock", 0] }] } } }, 0] },
							image: { $arrayElemAt: [{ $filter: { input: "$images", as: "image", cond: { $eq: ["$$image.default", true] } } }, 0] }
						},
					},
					{ $project: { name: 1, instock: { $ifNull: ["$stock.instock", 0] }, image: { $ifNull: ["$image.name", "$$productImage"] } } },
					{ $match: { instock: { $gt: 0 } } }
				]
			}
		},
		{ $match: { $expr: { $gt: [{ $size: "$variants" }, 0] } } },
		{
			$project: {
				_id: 0,
				product: "$_id",
				name: 1,
				code: 1,
				image: 1,
				amount: "$cost",
				unit: 1,
				subUnit: "$purchaseUnit",
				tax: 1,
				taxMethod: 1,
				variants: 1,
			},
		}
	]);

	return res.json({ options: products });
};

let getAdjustmentOptions = async (req, res) => {
	let products = await Product.aggregate([
		{ $match: { deletedAt: null } },
		{
			$lookup: {
				from: "variants",
				as: "variants",
				let: { productId: "$_id", productImage: "$image" },
				pipeline: [
					{ $match: { $expr: { $and: [{ $eq: ["$product", "$$productId"] }, { $eq: ["$deletedAt", null] }] } } },
					{
						$project: {
							name: 1,
							stock: { $arrayElemAt: [{ $filter: { input: "$stocks", as: "stock", cond: { $eq: ["$$stock.warehouse", mongoose.Types.ObjectId(req.query.warehouse)] } } }, 0] },
							image: { $arrayElemAt: [{ $filter: { input: "$images", as: "image", cond: { $eq: ["$$image.default", true] } } }, 0] }
						},
					},
					{ $project: { name: 1, instock: { $ifNull: ["$stock.instock", 0] }, image: { $ifNull: ["$image.name", "$$productImage"] } } }
				]
			}
		},
		{
			$project: {
				_id: 0,
				product: "$_id",
				name: 1,
				code: 1,
				image: 1,
				unit: 1,
				subUnit: "$purchaseUnit",
				variants: 1
			},
		},
	]);

	return res.json({ options: products });
};

let getQuotationOptions = async (req, res) => {
	let products = await Product.aggregate([
		{ $match: { deletedAt: null, availableForSale: true } },
		{
			$lookup: {
				from: "variants",
				as: "variants",
				let: { productId: "$_id", productImage: "$image" },
				pipeline: [
					{ $match: { $expr: { $and: [{ $eq: ["$product", "$$productId"] }, { $eq: ["$deletedAt", null] }, { $eq: ["$availableForSale", true] }] } } },
					{
						$project: {
							name: 1,
							stock: { $arrayElemAt: [{ $filter: { input: "$stocks", as: "stock", cond: { $eq: ["$$stock.warehouse", mongoose.Types.ObjectId(req.query.warehouse)] } } }, 0] },
							image: { $arrayElemAt: [{ $filter: { input: "$images", as: "image", cond: { $eq: ["$$image.default", true] } } }, 0] }
						},
					},
					{ $project: { name: 1, instock: { $ifNull: ["$stock.instock", 0] }, image: { $ifNull: ["$image.name", "$$productImage"] } } }
				]
			}
		},
		{
			$project: {
				_id: 0,
				product: "$_id",
				name: 1,
				code: 1,
				image: 1,
				amount: "$price",
				unit: 1,
				subUnit: "$saleUnit",
				tax: 1,
				taxMethod: 1,
				variants: 1,
			},
		}
	]);

	return res.json({ options: products });
};

exports.getOptions = (req, res) => {
	let { type } = req.query;

	let optionsMethods = {
		purchase: getPurchaseOptions,
		sale: getSaleOptions,
		purchaseReturn: getPurchaseReturnOptions,
		saleReturn: getSaleReturnOptions,
		transfer: getTransferOptions,
		adjustment: getAdjustmentOptions,
		quotation: getQuotationOptions
	}

	return optionsMethods[type](req, res);
}

exports.create = async (req, res) => {
	let { name, code, variants } = req.body;

	const { getImagesPath } = req.app.locals.config;

	let images = (req.files && req.files.images) || [];

	images = (Array.isArray(images) && images) || [images];

	images = images.filter((image) => !!image);

	let $or = [{ name }, { code }];

	let product = await Product.findOne({ $or });

	product && product.throwUniqueError({ name, code });

	product = new Product();

	product.fill(req.body);

	product.createdBy = req.me._id;

	if (variants.length) {
		variants = variants.map(variant => (new Variant({ name: variant, createdBy: req.me._id })));
	} else {
		variants = [new Variant({ name: "default", createdBy: req.me._id })];
	}

	product.variants = variants.map((variant) => variant._id);

	if (images.length) {
		images = await Promise.all(images.map((image) => fileMove(image, { dir: getImagesPath("products", product._id) })));

		product.image = images[0] || "";
	}

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([...variants.map(variant => variant.save()), product.save()]);

		await session.commitTransaction();

		res.status(201).json({ _id: product._id });
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.update = async (req, res) => {
	const { name, code } = req.body;

	const { id } = req.params;

	let $or = [{ name }, { code }];

	let product = await Product.findOne({ _id: { $ne: id }, $or });

	product && product.throwUniqueError({ name, code });

	let productData = {
		name: req.body.name,
		barcodeType: req.body.barcodeType,
		code: req.body.code,
		price: req.body.price,
		cost: req.body.cost,
		minimumStock: req.body.minimumStock,
		tax: req.body.tax,
		taxMethod: req.body.taxMethod,
		category: req.body.category,
		brand: req.body.brand,
		unit: req.body.unit,
		purchaseUnit: req.body.purchaseUnit,
		saleUnit: req.body.saleUnit,
		availableForSale: req.body.availableForSale,
		availableForPurchase: req.body.availableForPurchase,
		notes: req.body.notes,
		updatedBy: req.me._id,
	};

	let update = await Product.updateOne({ _id: id }, productData);

	if (!update.matchedCount) throw notFound();

	res.json({ _id: id });
};

exports.delete = async (req, res) => {
	const { id } = req.params;

	let del = await Product.deleteById(id, req.me._id);

	if (!del.matchedCount) throw notFound();

	del.modifiedCount && (await Product.incDel());

	res.json({});
};

exports.changeAvailability = async (req, res) => {
	let availabilities = ["availableForSale", "availableForSaleReturn", "availableForPurchase", "availableForPurchaseReturn"]

	let action = { isAvailable: false };

	availabilities.forEach(av => {
		if (typeof req.body[av] !== "undefined") {
			action.isAvailable = !!req.body[av];
			action.name = av;
		}
	});

	if (!action.name) throw notFound("action");

	let product = await Product.findById(req.params.id, action.name);

	if (!product) throw notFound();

	product[action.name] = action.isAvailable;

	product.updatedBy = req.me._id;

	await product.save();

	res.json({ action });
};

exports.changeImage = async (req, res) => {
	const { id } = req.params;

	let { image } = req.body;

	let update = await Product.updateOne({ _id: id }, { image });

	if (!update.matchedCount) throw notFound();

	res.json({});
};
