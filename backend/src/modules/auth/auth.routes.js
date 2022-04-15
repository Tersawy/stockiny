const express = require("express");

const router = express.Router();

const { isAuth } = require("../../middlewares/auth.guard");

const Controller = require("./AuthController");

const validation = require("./auth.validations");

const validationHandler = require("../../middlewares/validationHandler");

const fileUpload = require("express-fileupload");

router.post("/login", Controller.login);

router.get("/me", isAuth, Controller.me);

router.post(
	"/update-profile",
	isAuth,
	fileUpload(),
	validation.updateProfile,
	validationHandler,
	Controller.updateProfile
);

router.post("/reset-password", isAuth, Controller.resetPassword);

router.post("/new-password", isAuth, Controller.newPassword);

router.post("/verify-token", isAuth, Controller.verifyToken);

module.exports = router;
