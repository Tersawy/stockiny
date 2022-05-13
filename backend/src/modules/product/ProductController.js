const mongoose = require("mongoose");

const Product = require("./Product");

const fileMove = require("../../services/fileMove");

const { notFound, exists } = require("../../errors/ErrorHandler");

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
	const { id } = req.params;

	let product = await Product.findById(id).populate(
		"category brand unit createdBy updatedBy saleUnit purchaseUnit",
		"name username shortName"
	);

	product = product.toJSON();

	if (!product.updatedAt || product.updatedAt.getTime() - product.createdAt.getTime() === 0) {
		delete product.updatedAt;
		delete product.updatedBy;
	}

	if (product.variants && product.variants.length) {
		product.variants.forEach((variant) => {
			if (!variant.updatedAt || variant.updatedAt.getTime() - variant.createdAt.getTime() === 0) {
				delete variant.updatedAt;
				delete variant.updatedBy;
			}

			variant.stock = variant.stock.reduce((acc, stock) => acc + stock.quantity, 0);
		});
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

exports.getVariantStocks = async (req, res) => {
	let { id, variantId } = req.params;

	let product = await Product.findOne({ _id: id }, "variants._id variants.stock").populate(
		"variants.stock.warehouse",
		"name"
	);

	let variant = product.getVariantById(variantId);

	if (!variant) throw notFound();

	return res.json({ doc: variant });
};

/* 
	{
		name
		code
		image
		amount => cost
		unit ====> to get subunits in front end for select box
		subUnit => purchaseUnit
		tax
		taxMethod
		variants: [
			{ // gets only variants has available for purchase
				_id,
				name,
				image => variant default Image or productImage
				stock: Number
			}
		]
	}
*/
let getPurchaseOptions = async (req, res) => {
	let { warehouse } = req.query;

	let warehouseId = mongoose.Types.ObjectId(warehouse);

	let filterAvailableVariantsThatMatchesWarehouse = {
		input: "$variants",
		as: "variant",
		cond: {
			$and: [{ $eq: ["$$variant.availableForPurchase", true] }],
		},
	};

	let filteredVariant = {
		_id: "$$filteredVariant._id",
		name: "$$filteredVariant.name",
		image: {
			$arrayElemAt: ["$$filteredVariant.images", { $indexOfArray: ["$$filteredVariant.images.default", true] }],
		},
		stock: {
			$arrayElemAt: ["$$filteredVariant.stock", { $indexOfArray: ["$$filteredVariant.stock.warehouse", warehouseId] }],
		},
	};

	let products = await Product.aggregate([
		{
			$match: {
				deletedAt: null,
				availableForPurchase: true,
				"variants.availableForPurchase": true,
			},
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
				variants: {
					$map: {
						input: {
							$map: {
								input: { $filter: filterAvailableVariantsThatMatchesWarehouse },
								as: "filteredVariant",
								in: filteredVariant,
							},
						},
						as: "variant",
						in: {
							_id: "$$variant._id",
							name: "$$variant.name",
							image: { $ifNull: ["$$variant.image.name", "$image"] },
							stock: { $ifNull: ["$$variant.stock.quantity", 0] },
						},
					},
				},
			},
		},
	]);

	return res.json({ options: products });
};

/* 
	{
		name
		code
		image
		amount => price
		unit ====> to get subunits in front end for select box
		subUnit => saleUnit
		tax
		taxMethod
		variants: [
			{ // gets only variants has available for sale and quantity stock greater then 0
				_id,
				name,
				image => variant default Image or productImage
				stock: Number
			}
		]
	}
*/
let getSaleOptions = async (req, res) => {
	let { warehouse } = req.query;

	let warehouseId = mongoose.Types.ObjectId(warehouse);

	let filterAvailableVariantsThatMatchesWarehouse = {
		$filter: {
			input: "$variants",
			as: "variant",
			cond: {
				$and: [
					{ $eq: ["$$variant.availableForSale", true] },
					{ $gte: [{ $indexOfArray: ["$$variant.stock.warehouse", warehouseId] }, 0] },
				],
			},
		},
	};

	/*
	 * Map on filtered variants to get stock element from stock array also image the same case
	 */
	let variantsWithSingleStockThatMatchesWarehouse = {
		$map: {
			input: filterAvailableVariantsThatMatchesWarehouse,
			as: "filteredVariant",
			in: {
				_id: "$$filteredVariant._id",
				name: "$$filteredVariant.name",
				image: {
					$arrayElemAt: ["$$filteredVariant.images", { $indexOfArray: ["$$filteredVariant.images.default", true] }],
				},
				stock: {
					$arrayElemAt: [
						"$$filteredVariant.stock",
						{ $indexOfArray: ["$$filteredVariant.stock.warehouse", warehouseId] },
					],
				},
			},
		},
	};

	let filteredVariantsThatHaveValidQuantity = {
		$filter: {
			input: variantsWithSingleStockThatMatchesWarehouse,
			as: "variant",
			cond: { $gt: ["$$variant.stock.quantity", 0] },
		},
	};

	let products = await Product.aggregate([
		{
			$match: {
				deletedAt: null,
				availableForSale: true,
				"variants.availableForSale": true,
				"variants.stock.warehouse": warehouseId,
				"variants.stock.quantity": { $gt: 0 },
			},
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
				variants: {
					$map: {
						input: filteredVariantsThatHaveValidQuantity,
						as: "filteredVariant",
						in: {
							_id: "$$filteredVariant._id",
							name: "$$filteredVariant.name",
							image: { $ifNull: ["$$filteredVariant.image.name", "$image"] },
							stock: "$$filteredVariant.stock.quantity",
						},
					},
				},
			},
		},
		{
			$match: { $expr: { $gt: [{ $size: "$variants" }, 0] } },
		},
	]);

	return res.json({ options: products });
};

/* 
	{
		name
		code
		image
		amount => cost
		unit ====> to get subunits in front end for select box
		subUnit => purchaseUnit
		tax
		taxMethod
		variants: [
			{ // gets only variants has available for purchase return
				_id,
				name,
				image => variant default Image or productImage
				stock: Number
			}
		]
	}
*/
let getPurchaseReturnOptions = async (req, res) => {
	let { warehouse } = req.query;

	let warehouseId = mongoose.Types.ObjectId(warehouse);

	let filterAvailableVariantsThatMatchesWarehouse = {
		$filter: {
			input: "$variants",
			as: "variant",
			cond: {
				$and: [
					{ $eq: ["$$variant.availableForPurchaseReturn", true] },
					{ $gte: [{ $indexOfArray: ["$$variant.stock.warehouse", warehouseId] }, 0] },
				],
			},
		},
	};

	/*
	 * Map on filtered variants to get stock element from stock array also image the same case
	 */
	let variantsWithSingleStockThatMatchesWarehouse = {
		$map: {
			input: filterAvailableVariantsThatMatchesWarehouse,
			as: "filteredVariant",
			in: {
				_id: "$$filteredVariant._id",
				name: "$$filteredVariant.name",
				image: {
					$arrayElemAt: ["$$filteredVariant.images", { $indexOfArray: ["$$filteredVariant.images.default", true] }],
				},
				stock: {
					$arrayElemAt: [
						"$$filteredVariant.stock",
						{ $indexOfArray: ["$$filteredVariant.stock.warehouse", warehouseId] },
					],
				},
			},
		},
	};

	let filteredVariantsThatHaveValidQuantity = {
		$filter: {
			input: variantsWithSingleStockThatMatchesWarehouse,
			as: "variant",
			cond: { $gt: ["$$variant.stock.quantity", 0] },
		},
	};

	let products = await Product.aggregate([
		{
			$match: {
				deletedAt: null,
				availableForPurchaseReturn: true,
				"variants.availableForPurchaseReturn": true,
				"variants.stock.warehouse": warehouseId,
				"variants.stock.quantity": { $gt: 0 },
			},
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
				variants: {
					$map: {
						input: filteredVariantsThatHaveValidQuantity,
						as: "filteredVariant",
						in: {
							_id: "$$filteredVariant._id",
							name: "$$filteredVariant.name",
							image: { $ifNull: ["$$filteredVariant.image.name", "$image"] },
							stock: "$$filteredVariant.stock.quantity",
						},
					},
				},
			},
		},
		{
			$match: { $expr: { $gt: [{ $size: "$variants" }, 0] } },
		},
	]);

	return res.json({ options: products });
};

/* 
	{
		name
		code
		image
		amount => price
		unit ====> to get subunits in front end for select box
		subUnit => saleUnit
		tax
		taxMethod
		variants: [
			{ // gets only variants has available for sale return
				_id,
				name,
				image => variant default Image or productImage
				stock: Number
			}
		]
	}
*/
let getSaleReturnOptions = async (req, res) => {
	let { warehouse } = req.query;

	let warehouseId = mongoose.Types.ObjectId(warehouse);

	let filterAvailableVariantsThatMatchesWarehouse = {
		input: "$variants",
		as: "variant",
		cond: {
			$and: [{ $eq: ["$$variant.availableForSaleReturn", true] }],
		},
	};

	let filteredVariant = {
		_id: "$$filteredVariant._id",
		name: "$$filteredVariant.name",
		image: {
			$arrayElemAt: ["$$filteredVariant.images", { $indexOfArray: ["$$filteredVariant.images.default", true] }],
		},
		stock: {
			$arrayElemAt: ["$$filteredVariant.stock", { $indexOfArray: ["$$filteredVariant.stock.warehouse", warehouseId] }],
		},
	};

	let products = await Product.aggregate([
		{
			$match: {
				deletedAt: null,
				availableForSaleReturn: true,
				"variants.availableForSaleReturn": true,
			},
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
				variants: {
					$map: {
						input: {
							$map: {
								input: { $filter: filterAvailableVariantsThatMatchesWarehouse },
								as: "filteredVariant",
								in: filteredVariant,
							},
						},
						as: "variant",
						in: {
							_id: "$$variant._id",
							name: "$$variant.name",
							image: { $ifNull: ["$$variant.image.name", "$image"] },
							stock: { $ifNull: ["$$variant.stock.quantity", 0] },
						},
					},
				},
			},
		},
	]);

	return res.json({ options: products });
};

/* 
	{
		name
		code
		image
		amount => cost
		unit ====> to get subunits in front end for select box
		subUnit => purchaseUnit
		tax
		taxMethod
		variants: [
			{ // gets only variants has available for purchase return
				_id,
				name,
				image => variant default Image or productImage
				stock: Number
			}
		]
	}
*/
let getTransferOptions = async (req, res) => {
	let { warehouse } = req.query;

	let warehouseId = mongoose.Types.ObjectId(warehouse);

	let filterAvailableVariantsThatMatchesWarehouse = {
		$filter: {
			input: "$variants",
			as: "variant",
			cond: { $gte: [{ $indexOfArray: ["$$variant.stock.warehouse", warehouseId] }, 0] },
		},
	};

	/*
	 * Map on filtered variants to get stock element from stock array also image the same case
	 */
	let variantsWithSingleStockThatMatchesWarehouse = {
		$map: {
			input: filterAvailableVariantsThatMatchesWarehouse,
			as: "filteredVariant",
			in: {
				_id: "$$filteredVariant._id",
				name: "$$filteredVariant.name",
				image: {
					$arrayElemAt: ["$$filteredVariant.images", { $indexOfArray: ["$$filteredVariant.images.default", true] }],
				},
				stock: {
					$arrayElemAt: [
						"$$filteredVariant.stock",
						{ $indexOfArray: ["$$filteredVariant.stock.warehouse", warehouseId] },
					],
				},
			},
		},
	};

	let filteredVariantsThatHaveValidQuantity = {
		$filter: {
			input: variantsWithSingleStockThatMatchesWarehouse,
			as: "variant",
			cond: { $gt: ["$$variant.stock.quantity", 0] },
		},
	};

	let products = await Product.aggregate([
		{
			$match: {
				deletedAt: null,
				"variants.stock.warehouse": warehouseId,
				"variants.stock.quantity": { $gt: 0 },
			},
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
				variants: {
					$map: {
						input: filteredVariantsThatHaveValidQuantity,
						as: "filteredVariant",
						in: {
							_id: "$$filteredVariant._id",
							name: "$$filteredVariant.name",
							image: { $ifNull: ["$$filteredVariant.image.name", "$image"] },
							stock: "$$filteredVariant.stock.quantity",
						},
					},
				},
			},
		},
		{
			$match: { $expr: { $gt: [{ $size: "$variants" }, 0] } },
		},
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
	}

	return optionsMethods[type](req, res);
}

exports.create = async (req, res) => {
	const { name, code, variants } = req.body;

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

	product.variants = variants.length ? variants.map((variant) => ({ name: variant })) : [{ name: "default" }];

	if (images.length) {
		let images = await Promise.all(
			images.map((image) => fileMove(image, { dir: getImagesPath("products", product._id) }))
		);

		product.image = images[0] || "";
	}

	await product.save();

	res.status(201).json({ _id: product._id });
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

exports.changeSaleAvailability = async (req, res) => {
	const { id } = req.params;

	const { availableForSale } = req.body;

	let product = await Product.findById(id, "availableForSale");

	if (!product) throw notFound();

	product.availableForSale = availableForSale;

	product.updatedBy = req.me._id;

	await product.save();

	res.json({ availableForSale: product.availableForSale });
};

exports.changeSaleReturnAvailability = async (req, res) => {
	const { id } = req.params;

	const { availableForSaleReturn } = req.body;

	let product = await Product.findById(id, "availableForSaleReturn");

	if (!product) throw notFound();

	product.availableForSaleReturn = availableForSaleReturn;

	product.updatedBy = req.me._id;

	await product.save();

	res.json({ availableForSaleReturn: product.availableForSaleReturn });
};

exports.changePurchaseAvailability = async (req, res) => {
	const { id } = req.params;

	const { availableForPurchase } = req.body;

	let product = await Product.findById(id, "availableForPurchase");

	if (!product) throw notFound();

	product.availableForPurchase = availableForPurchase;

	product.updatedBy = req.me._id;

	await product.save();

	res.json({ availableForPurchase: product.availableForPurchase });
};

exports.changePurchaseReturnAvailability = async (req, res) => {
	const { id } = req.params;

	const { availableForPurchaseReturn } = req.body;

	let product = await Product.findById(id, "availableForPurchaseReturn");

	if (!product) throw notFound();

	product.availableForPurchaseReturn = availableForPurchaseReturn;

	product.updatedBy = req.me._id;

	await product.save();

	res.json({ availableForPurchaseReturn: product.availableForPurchaseReturn });
};

exports.changeImage = async (req, res) => {
	const { id } = req.params;

	let { image } = req.body;

	let update = await Product.updateOne({ _id: id }, { image });

	if (!update.matchedCount) throw notFound();

	res.json({});
};

exports.addVariant = async (req, res) => {
	const { id } = req.params;

	let { name } = req.body;

	let product = await Product.findById(id, "variants");

	if (!product) throw notFound();

	product.addVariant({ name });

	product.updatedBy = req.me._id;

	product = await product.save();

	let variant = product.getVariantByName(name);

	res.status(201).json({ variant });
};

exports.updateVariant = async (req, res) => {
	const { id, variantId } = req.params;

	let { name } = req.body;

	let product = await Product.findById(id, "variants");

	if (!product) throw notFound();

	let variant = product.getVariantByName(name);

	let variantHasSameName = variant && variant._id.toString() !== variantId;

	if (variantHasSameName) throw exists("name");

	variant = product.getVariantById(variantId);

	if (!variant) throw notFound("Variant");

	variant.name = name;

	product.updatedBy = req.me._id;

	product = await product.save();

	res.json({ variant });
};

exports.changeVariantSaleAvailability = async (req, res) => {
	const { id, variantId } = req.params;

	let { availableForSale } = req.body;

	let product = await Product.findOne({ _id: id, "variants.$._id": variantId }, "variants");

	if (!product) throw notFound();

	let variant = product.getVariantById(variantId);

	if (!variant) throw notFound("Variant");

	variant.availableForSale = availableForSale;

	product.updatedBy = req.me._id;

	await product.save();

	res.json({ availableForSale: variant.availableForSale });
};

exports.changeVariantSaleReturnAvailability = async (req, res) => {
	const { id, variantId } = req.params;

	let { availableForSaleReturn } = req.body;

	let product = await Product.findOne({ _id: id, "variants.$._id": variantId }, "variants");

	if (!product) throw notFound();

	let variant = product.getVariantById(variantId);

	if (!variant) throw notFound("Variant");

	variant.availableForSaleReturn = availableForSaleReturn;

	product.updatedBy = req.me._id;

	await product.save();

	res.json({ availableForSaleReturn: variant.availableForSaleReturn });
};

exports.changeVariantPurchaseAvailability = async (req, res) => {
	const { id, variantId } = req.params;

	let { availableForPurchase } = req.body;

	let product = await Product.findOne({ _id: id, "variants.$._id": variantId }, "variants");

	if (!product) throw notFound();

	let variant = product.getVariantById(variantId);

	if (!variant) throw notFound("Variant");

	variant.availableForPurchase = availableForPurchase;

	product.updatedBy = req.me._id;

	await product.save();

	return res.json({ availableForPurchase: variant.availableForPurchase });
};

exports.changeVariantPurchaseReturnAvailability = async (req, res) => {
	const { id, variantId } = req.params;

	let { availableForPurchaseReturn } = req.body;

	let product = await Product.findOne({ _id: id, "variants.$._id": variantId }, "variants");

	if (!product) throw notFound();

	let variant = product.getVariantById(variantId);

	if (!variant) throw notFound("Variant");

	variant.availableForPurchaseReturn = availableForPurchaseReturn;

	product.updatedBy = req.me._id;

	await product.save();

	return res.json({ availableForPurchaseReturn: variant.availableForPurchaseReturn });
};

exports.changeVariantImages = async (req, res) => {
	const { id, variantId } = req.params;

	let { images } = req.body;

	if (images.length) {
		images = images.map((image) => ({ name: image }));
		images[0].default = true;
	}

	let update = await Product.updateOne(
		{ _id: id, "variants._id": variantId },
		{ "variants.$.images": images, updatedBy: req.me._id, "variants.$.updatedAt": new Date() }
	);

	if (!update.matchedCount) throw notFound("Variant");

	res.json({});
};

exports.changeVariantDefaultImage = async (req, res) => {
	const { id, variantId } = req.params;

	let { image } = req.body;

	let product = await Product.findOne({ _id: id, "variants.$._id": variantId }, "variants");

	if (!product) throw notFound();

	let variant = product.getVariantById(variantId);

	if (!variant) throw notFound("Variant");

	variant.updatedAt = new Date();

	variant.setDefaultImage(image);

	product.updatedBy = req.me._id;

	await product.save();

	res.json({});
};
