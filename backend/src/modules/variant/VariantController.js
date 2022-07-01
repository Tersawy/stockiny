const mongoose = require("mongoose");

const Variant = require("./Variant");

const Product = require("../product/Product");

const { notFound } = require("../../errors/ErrorHandler");

exports.variants = async (req, res) => {
	let { product } = req.query;

	let variants = await Variant.find({ product }, "name stocks images updatedAt createdAt updatedBy createdBy availableForSale availableForSaleReturn availableForPurchase availableForPurchaseReturn");

	variants = variants.map((variant) => ({
		_id: variant._id,
		name: variant.name,
		instock: variant.instock,
		availableForSale: variant.availableForSale,
		availableForSaleReturn: variant.availableForSaleReturn,
		availableForPurchase: variant.availableForPurchase,
		availableForPurchaseReturn: variant.availableForPurchaseReturn,
		images: variant.images,
		createdAt: variant.createdAt,
		createdBy: variant.createdBy,
		updatedAt: variant.isUpdated ? variant.updatedAt : undefined,
		updatedBy: variant.isUpdated ? variant.updatedBy : undefined
	}));

	res.json({ variants });
};

exports.create = async (req, res) => {
	let product = await Product.findById(req.body.productId, "variants");

	if (!product) throw notFound("product");

	let variant = new Variant({ name: req.body.name, createdBy: req.me._id, product: req.body.productId });

	product.variants.push(variant._id);

	let session = await mongoose.startSession();

	session.startTransaction();

	try {
		await Promise.all([variant.save(), product.save()]);

		await session.commitTransaction();

		res.status(201).json({ variant });
	} catch (error) {
		await session.abortTransaction();

		throw error;
	} finally {
		session.endSession();
	}
};

exports.update = async (req, res) => {
	let variant = await Variant.findById(req.params.id);

	if (!variant) throw notFound("variant");

	variant.name = req.body.name;

	variant.updatedBy = req.me._id;

	variant = await variant.save();

	res.json({ variant });
};

exports.stocks = async (req, res) => {
	let variant = await Variant.findById(req.params.id, "stocks").populate("stocks.warehouse", "name");

	if (!variant) throw notFound();

	return res.json({ doc: variant });
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

	let variant = await Variant.findById(req.params.id);

	if (!variant) throw notFound("variant");

	variant[action.name] = action.isAvailable;

	variant.updatedBy = req.me._id;

	await variant.save();

	res.json({ action });
};

exports.changeImages = async (req, res) => {
	let { images } = req.body;

	if (images.length) {
		images = images.map((image) => ({ name: image }));
		images[0].default = true;
	}

	let variant = await Variant.findById(req.params.id);

	if (!variant) throw notFound("variant");

	variant.images = images;

	variant.updatedBy = req.me._id;

	await variant.save();

	res.json({});
};

exports.changeDefaultImage = async (req, res) => {
	let variant = await Variant.findById(req.params.id);

	if (!variant) throw notFound("variant");

	variant.setDefaultImage(req.body.image);

	variant.updatedBy = req.me._id;

	await variant.save();

	res.json({});
};
