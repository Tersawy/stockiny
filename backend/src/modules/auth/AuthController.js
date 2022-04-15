const User = require("../user/User");

const bcrypt = require("bcrypt");

const path = require("path");

const { unlinkSync, existsSync } = require("fs");

const { sign } = require("../../services/jwt");

const { createError } = require("../../errors/ErrorHandler");

const { randomToken } = require("../../services/crypto");

const fileMove = require("../../services/fileMove");

const userImagesDir = path.join(__dirname, "../../../public/images/users");

// const nodemailer = require("nodemailer");

// const sgMail = require("@sendgrid/mail");

// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.login = async (req, res) => {
	const { email, password } = req.body;

	let me = await User.findByEmail(email).onlyActive().withPermissions();

	if (!me) throw createError("Email or password are not valid", 401);

	let isMatch = await me.isPasswordMatch(password);

	if (!isMatch) throw createError("Email or password are not valid", 401);

	let token = await sign({ userId: me._id, type: me.type });

	me.mergePermissions();

	me = {
		_id: me._id,
		username: me.username,
		fullname: me.fullname,
		phone: me.phone,
		email: me.email,
		country: me.country,
		city: me.city,
		address: me.address,
		zipCode: me.zipCode,
		image: me.image,
		isOwner: me.isOwner,
		permissions: me.permissions,
	};

	res.status(200).json({ token, me });
};

exports.me = async (req, res) => {
	return res.json({
		_id: req.me._id,
		username: req.me.username,
		fullname: req.me.fullname,
		phone: req.me.phone,
		email: req.me.email,
		country: req.me.country,
		city: req.me.city,
		address: req.me.address,
		zipCode: req.me.zipCode,
		image: req.me.image,
		isOwner: req.me.isOwner,
		permissions: req.me.permissions,
	});
};

exports.updateProfile = async (req, res) => {
	const { username, fullname, phone, email, password, country, city, address, zipCode } = req.body;

	let image = (req.files && req.files.image) || null;

	image = (Array.isArray(image) && image[0]) || image || null;

	let $or = [{ username }, { phone }, { email }];

	let user = await User.findOne({ _id: { $ne: req.me._id }, $or });

	user && user.throwUniqueError({ username, phone, email });

	let updateData = { username, fullname, phone, email, country, city, address, zipCode };

	updateData.image = await uploadImage(image, req.me.image, !req.body.image);

	if (password) {
		updateData.password = await bcrypt.hash(password, 10);
	}

	await User.updateOne({ _id: req.me._id }, updateData);

	res.json({ message: "Your Profile has been updated successfully" });
};

exports.changeImage = async (req, res) => {
	const { me } = req.body;

	let image = (req.files && req.files.image) || null;

	image = (Array.isArray(image) && image[0]) || image || null;

	image = await uploadImage(image, req.me.image, true);

	await User.updateOne({ _id: req.me._id }, { image });

	res.json({ message: "Your image has been updated successfully" });
};

exports.resetPassword = async (req, res) => {
	const { email } = req.body;

	const token = await randomToken(32);

	let user = await User.findByEmail(email).onlyActive();

	if (!user) throw createError({ errors: { email: "Email doesn't exist !" } }, 422);

	user.resetPasswordToken = token;

	user.resetPasswordExpires = Date.now() + 1200000;

	await user.save();

	let url = `${process.env.FRONT_URL}/reset/${token}`;

	const msg = {
		to: user.email,
		from: process.env.EMAIL,
		subject: "🌻 Locanos Password Reset 🌻",
		text: "and easy to do anywhere, even with Node.js",
		html: `
          <p>Hey ${user.username},</p>
          <p>We heard that you lost your Locanos password. Sorry about that!</p>
          <p>But don’t worry! You can use the following link to reset your password:</p>
          <a href=${url}>${url}</a>
          <p>If you don’t use this link within 20 minutes, it will expire.</p>
          <p>Do something outside today! </p>
          <p>–Your friends at Locanos</p>
          `,
	};

	await sgMail.send(msg);

	res.json({ message: "Email sent!" });
};

exports.newPassword = async (req, res) => {
	const { token, password } = req.body;

	let user = await User.findByResetPasswordToken(token);

	if (!user) throw createError("Url has been expired !", 400);

	let _password = await bcrypt.hash(password, 10);

	user.password = _password;

	user.resetPasswordToken = null;

	await user.save();

	res.json({ message: "password has been changed successfuly" });
};

exports.verifyToken = async (req, res) => {
	const { token } = req.body;

	let user = await User.findByResetPasswordToken(token);

	if (!user) throw createError("Url has been expired !", 400);

	res.json({});
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
