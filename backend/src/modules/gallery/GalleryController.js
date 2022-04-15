const mongoose = require("mongoose");

const isMongoId = (id) => mongoose.Types.ObjectId.isValid(id);

const { readdirSync, existsSync, unlinkSync } = require("fs");

const fileMove = require("../../services/fileMove");

exports.getProductGallery = (req, res) => {
	const { productId } = req.params;

	if (!productId || !isMongoId(productId)) return res.json({ files: [] });

	const { getImagesPath } = req.app.locals.config;

	let productPath = getImagesPath("products", productId);

	if (!existsSync(productPath)) return res.json({ files: [] });

	const files = readdirSync(productPath);

	res.json({ files });
};

exports.uploadToProductGallery = async (req, res) => {
	const { productId } = req.params;

	if (!productId || !isMongoId(productId)) return res.json({ files: [] });

	let images = (req.files && req.files.images) || [];

	images = (Array.isArray(images) && images) || [images];

	images = images.filter((image) => !!image);

	const { getImagesPath } = req.app.locals.config;

	let productPath = getImagesPath("products", productId);

	if (images.length) {
		images = await Promise.all(images.map((image) => fileMove(image, { dir: productPath })));
	}

	res.json({ files: images });
};

exports.deleteFromProductGallery = async (req, res) => {
	let { images, imagesPath } = req.body;

	if (imagesPath.length) {
		for (let image of imagesPath) {
			unlinkSync(image);
		}
	}

	res.json({ files: images });
};
