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

	product.deletedAt = undefined;
	product.deletedBy = undefined;
	product.__v = undefined;

	res.json({ doc: product });
};

exports.getEdit = async (req, res) => {
	const { id } = req.params;

	let select =
		"name category brand barcodeType code price cost tax taxMethod minimumStock unit purchaseUnit saleUnit notes availableForSale availableForPurchase";

	let product = await Product.findById(id, select);

	res.json({ doc: product });
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

	let products = await Product.aggregate([
		{ $match: { deletedAt: null, availableForPurchase: true } },
		{
			$lookup: {
				from: "variants",
				as: "variants",
				let: { productId: "$_id", productImage: "$image" },
				pipeline: [
					{ $match: { $expr: { $and: [{ $eq: ["$product", "$$productId"] }, { $eq: ["$availableForPurchase", true] }] } } },
					{
						$project: {
							_id: 1,
							name: 1,
							stock: { $ifNull: [{ $arrayElemAt: [{ $filter: { input: "$stocks", as: "stock", cond: { $eq: ["$$stock.warehouse", warehouseId] } } }, 0] }, 0] },
							images: { $ifNull: [{ $arrayElemAt: [{ $filter: { input: "$images", as: "image", cond: { $eq: ["$$image.default", true] } } }, 0] }, "$$productImage"] },
						}
					},
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
				image: { $arrayElemAt: [{ $filter: { input: "$$filteredVariant.images", as: "image", cond: { $eq: ["$$image.default", true] } } }, 0] },
				stock: { $arrayElemAt: [{ $filter: { input: "$$filteredVariant.stock", as: "stock", cond: { $eq: ["$$stock.warehouse", warehouseId] } } }, 0] }
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
				image: { $arrayElemAt: [{ $filter: { input: "$$filteredVariant.images", as: "image", cond: { $eq: ["$$image.default", true] } } }, 0] },
				stock: { $arrayElemAt: [{ $filter: { input: "$$filteredVariant.stock", as: "stock", cond: { $eq: ["$$stock.warehouse", warehouseId] } } }, 0] }
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
		image: { $arrayElemAt: [{ $filter: { input: "$$filteredVariant.images", as: "image", cond: { $eq: ["$$image.default", true] } } }, 0] },
		stock: { $arrayElemAt: [{ $filter: { input: "$$filteredVariant.stock", as: "stock", cond: { $eq: ["$$stock.warehouse", warehouseId] } } }, 0] }
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
				image: { $arrayElemAt: [{ $filter: { input: "$$filteredVariant.images", as: "image", cond: { $eq: ["$$image.default", true] } } }, 0] },
				stock: { $arrayElemAt: [{ $filter: { input: "$$filteredVariant.stock", as: "stock", cond: { $eq: ["$$stock.warehouse", warehouseId] } } }, 0] }
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
let getAdjustmentOptions = async (req, res) => {
	let { warehouse } = req.query;

	let warehouseId = mongoose.Types.ObjectId(warehouse);

	let products = await Product.aggregate([
		{
			$match: { deletedAt: null },
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
				variants: {
					$map: {
						input: {
							$map: {
								input: "$variants",
								as: "variantWithStock",
								in: {
									_id: "$$variantWithStock._id",
									name: "$$variantWithStock.name",
									image: { $arrayElemAt: [{ $filter: { input: "$$variantWithStock.images", as: "image", cond: { $eq: ["$$image.default", true] } } }, 0] },
									stock: { $arrayElemAt: [{ $filter: { input: "$$variantWithStock.stock", as: "stock", cond: { $eq: ["$$stock.warehouse", warehouseId] } } }, 0] },
								},
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
			{ // gets only variants has available for purchase
				_id,
				name,
				image => variant default Image or productImage
				stock: Number
			}
		]
	}
*/
let getQuotationOptions = async (req, res) => {
	let { warehouse } = req.query;

	let warehouseId = mongoose.Types.ObjectId(warehouse);

	let filterAvailableVariantsThatMatchesWarehouse = {
		$filter: {
			input: "$variants",
			as: "variant",
			cond: { $eq: ["$$variant.availableForSale", true] },
		},
	};

	/*
	 * Map on filtered variants to get stock element from stock array also image the same case
	 */
	let filteredVariant = {
		$map: {
			input: filterAvailableVariantsThatMatchesWarehouse,
			as: "filteredVariant",
			in: {
				_id: "$$filteredVariant._id",
				name: "$$filteredVariant.name",
				image: { $arrayElemAt: [{ $filter: { input: "$$filteredVariant.images", as: "image", cond: { $eq: ["$$image.default", true] } } }, 0] },
				stock: { $arrayElemAt: [{ $filter: { input: "$$filteredVariant.stock", as: "stock", cond: { $eq: ["$$stock.warehouse", warehouseId] } } }, 0] }
			},
		},
	};

	let products = await Product.aggregate([
		{
			$match: {
				deletedAt: null,
				availableForSale: true,
				"variants.availableForSale": true,
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
						input: filteredVariant,
						as: "variant",
						in: {
							_id: "$$variant._id",
							name: "$$variant.name",
							image: { $ifNull: ["$$variant.image.name", "$image"] },
							stock: { $ifNull: ["$$variant.stock.quantity", 0] }
						},
					},
				},
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
