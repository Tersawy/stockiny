const User = require("./User");

const fileMove = require("../../services/fileMove");

const path = require("path");

const { unlinkSync, existsSync } = require("fs");

const { notFound } = require("../../errors/ErrorHandler");

const bcrypt = require("bcrypt");

const userImagesDir = path.join(__dirname, "../../../public/images/users");

exports.users = async (req, res) => {
	let select = "username fullname phone email country city address zipCode role image isActive";

	let query = { _id: { $ne: req.me._id }, isOwner: false };

	let usersQuery = User.find(query, select)
		.withPagination(req.query)
		.withSearch(req.query)
		.populate({ path: "role", select: "name" });

	let counts = User.count().withSearch(req.query);

	let [docs, total] = await Promise.all([usersQuery, counts]);

	res.json({ docs, total });
};

exports.user = async (req, res) => {
	let select = "username fullname phone email country city address zipCode role permissions image isActive";

	if (req.me._id == req.params.id) return res.json(req.me);

	let query = { _id: req.params.id, isOwner: false };

	let user = await User.findOne(query, select).withPermissions();

	if (!user) throw notFound();

	user.mergePermissions();

	user.role = (user.role && user.role._id) || null;

	res.json({ doc: user });
};

exports.create = async (req, res) => {
	const { username, phone, email, password } = req.body;

	let image = (req.files && req.files.image) || null;

	image = (Array.isArray(image) && image[0]) || image || null;

	let $or = [{ username }, { phone }, { email }];

	let user = await User.findOne({ $or });

	user && user.throwUniqueError({ username, phone, email });

	user = new User();

	user.fill(req.body);

	user.image = await uploadImage(image);

	user.createdBy = req.me._id;

	await user.setPassword(password);

	await user.save();

	res.status(201).json({ message: "User has been created successfully" });
};

exports.update = async (req, res) => {
	let { username, phone, email, password } = req.body;

	let image = (req.files && req.files.image) || null;

	image = (Array.isArray(image) && image[0]) || image || null;

	const { id } = req.params;

	if (req.me._id == id) {
		return res.status(403).json({ message: "You can't edit your own profile from here" });
	}

	let $or = [{ username }, { phone }, { email }];

	let user = await User.findOne({ _id: { $ne: id }, $or });

	user && user.throwUniqueError({ username, phone, email });

	user = await User.findOne({ _id: id, isOwner: false });

	if (!user) throw notFound();

	req.body.image = await uploadImage(image, user.image, !req.body.image);

	user.fill(req.body);

	user.password = password ? bcrypt.hashSync(password, 10) : user.password;

	user.updatedBy = req.me._id;

	await user.save();

	res.json({ message: "User has been updated successfully" });
};

exports.changeActivation = async (req, res) => {
	const { id } = req.params;

	let user = await User.findOne({ _id: id, isOwner: false });

	if (!user) throw notFound();

	user.isActive = !user.isActive;

	user.updatedBy = req.me._id;

	await user.save();

	res.json({ message: "User has been activated successfully", isActive: user.isActive });
};

exports.changeImage = async (req, res) => {
	const { id } = req.params;

	let image = (req.files && req.files.image) || null;

	image = (Array.isArray(image) && image[0]) || image || null;

	let user = await User.findOne({ _id: id, isOwner: false });

	if (!user) throw notFound();

	user.image = await uploadImage(image, user.image, true);

	user.updatedBy = req.me._id;

	await user.save();

	res.json({ message: "Image has been changed successfully" });
};

exports.delete = async (req, res) => {
	const { id } = req.params;

	let del = await User.deleteOne({ _id: id, isOwner: false }, req.me._id);

	if (!del.matchedCount) throw notFound();

	del.modifiedCount && (await User.incDel());

	res.json({ message: "User has been deleted successfully" });
};

let uploadImage = async (image, oldImage, imageDeleted) => {
	let imageName = (image && (await fileMove(image, { dir: userImagesDir }))) || null;

	(imageName || imageDeleted) && removeImage(oldImage);

	return imageDeleted ? imageName : imageName || oldImage;
};

let removeImage = (image) => {
	if (!image) return false;

	let imagePath = path.join(userImagesDir, image) || null;

	if (imagePath && existsSync(imagePath)) unlinkSync(imagePath);

	return true;
};
