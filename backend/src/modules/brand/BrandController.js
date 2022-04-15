const Brand = require("./Brand");

const fileMove = require("../../services/fileMove");

const path = require("path");

const { unlinkSync, existsSync } = require("fs");

const { notFound } = require("../../errors/ErrorHandler");

const brandImagesDir = path.join(__dirname, "../../../public/images/brands");

exports.brands = async (req, res) => {
	let select = "name description image";

	let query = Brand.find({}, select).withPagination(req.query).withSearch(req.query);

	let counts = Brand.count().withSearch(req.query);

	let [docs, total] = await Promise.all([query, counts]);

	res.json({ docs, total });
};

exports.options = async (req, res) => {
	let options = await Brand.find({}, "name image");

	res.json({ options });
};

exports.create = async (req, res) => {
	const { name, description } = req.body;

	let image = (req.files && req.files.image) || null;

	image = (Array.isArray(image) && image[0]) || image || null;

	let brand = await Brand.findOne({ name });

	brand && brand.throwUniqueError({ name });

	brand = new Brand({ name, description, createdBy: req.me._id });

	brand.image = await uploadImage(image);

	await brand.save();

	res.status(201).json({ message: "Brand has been created successfully" });
};

exports.update = async (req, res) => {
	const { name, description, imageDeleted } = req.body;

	let image = (req.files && req.files.image) || null;

	image = (Array.isArray(image) && image[0]) || image || null;

	const { id } = req.params;

	let brand = await Brand.findOne({ _id: { $ne: id }, name });

	brand && brand.throwUniqueError({ name });

	brand = await Brand.findById(id);

	if (!brand) throw notFound();

	brand.name = name;

	brand.description = description;

	brand.image = await uploadImage(image, brand.image, imageDeleted);

	brand.updatedBy = req.me._id;

	await brand.save();

	res.json({ message: "Brand has been updated successfully" });
};

exports.changeImage = async (req, res) => {
	const { id } = req.params;

	let image = (req.files && req.files.image) || null;

	image = (Array.isArray(image) && image[0]) || image || null;

	let brand = await Brand.findById(id);

	if (!brand) throw notFound();

	brand.image = await uploadImage(image, brand.image, true);

	brand.updatedBy = req.me._id;

	await brand.save();

	res.json({ message: "Image has been changed successfully" });
};

exports.delete = async (req, res) => {
	const { id } = req.params;

	let del = await Brand.deleteById(id, req.me._id);

	if (!del.matchedCount) throw notFound();

	del.modifiedCount && (await Brand.incDel());

	res.json({ message: "Brand has been deleted successfully" });
};

let uploadImage = async (image, oldImage, imageDeleted) => {
	let imageName = (image && (await fileMove(image, { dir: brandImagesDir }))) || null;

	(imageName || imageDeleted) && removeImage(oldImage);

	return imageDeleted ? imageName : imageName || oldImage;
};

let removeImage = (image) => {
	if (!image) return false;

	let imagePath = path.join(brandImagesDir, image) || null;

	if (imagePath && existsSync(imagePath)) unlinkSync(imagePath);

	return true;
};
