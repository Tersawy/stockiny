const Category = require("./Category");

const fileMove = require("../../services/fileMove");

const path = require("path");

const { unlinkSync, existsSync } = require("fs");

const { notFound } = require("../../errors/ErrorHandler");

const categoryImagesDir = path.join(__dirname, "../../../public/images/categories");

exports.categories = async (req, res) => {
	let select = "name code description image";

	let query = Category.find({}, select).withPagination(req.query).withSearch(req.query);

	let counts = Category.count().withSearch(req.query);

	let [docs, total] = await Promise.all([query, counts]);

	res.json({ docs, total });
};

exports.options = async (req, res) => {
	let options = await Category.find({}, "name image");

	res.json({ options });
};

exports.create = async (req, res) => {
	const { name, description, code } = req.body;

	let image = (req.files && req.files.image) || null;

	image = (Array.isArray(image) && image[0]) || image || null;

	let category = await Category.findOne({ $or: [{ name }, { code }] });

	category && category.throwUniqueError({ name, code });

	category = new Category({ name, code, description, createdBy: req.me._id });

	category.image = await uploadImage(image);

	await category.save();

	res.status(201).json({ message: "Category has been created successfully" });
};

exports.update = async (req, res) => {
	const { name, description, code, imageDeleted } = req.body;

	let image = (req.files && req.files.image) || null;

	image = (Array.isArray(image) && image[0]) || image || null;

	const { id } = req.params;

	let category = await Category.findOne({ _id: { $ne: id }, $or: [{ name }, { code }] });

	category && category.throwUniqueError({ name, code });

	category = await Category.findById(id);

	if (!category) throw notFound();

	category.name = name;

	category.code = code;

	category.description = description;

	category.image = await uploadImage(image, category.image, imageDeleted);

	category.updatedBy = req.me._id;

	await category.save();

	res.json({ message: "Category has been updated successfully" });
};

exports.changeImage = async (req, res) => {
	const { id } = req.params;

	let image = (req.files && req.files.image) || null;

	image = (Array.isArray(image) && image[0]) || image || null;

	let category = await Category.findById(id);

	if (!category) throw notFound();

	category.image = await uploadImage(image, category.image, true);

	category.updatedBy = req.me._id;

	await category.save();

	res.json({ message: "Image has been changed successfully" });
};

exports.delete = async (req, res) => {
	const { id } = req.params;

	let del = await Category.deleteById(id, req.me._id);

	if (!del.matchedCount) throw notFound();

	del.modifiedCount && (await Category.incDel());

	res.json({ message: "Category has been deleted successfully" });
};

let uploadImage = async (image, oldImage, imageDeleted) => {
	let imageName = (image && (await fileMove(image, { dir: categoryImagesDir }))) || null;

	(imageName || imageDeleted) && removeImage(oldImage);

	return imageDeleted ? imageName : imageName || oldImage;
};

let removeImage = (image) => {
	if (!image) return false;

	let imagePath = path.join(categoryImagesDir, image) || null;

	if (imagePath && existsSync(imagePath)) unlinkSync(imagePath);

	return true;
};
