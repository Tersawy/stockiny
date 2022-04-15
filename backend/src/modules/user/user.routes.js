const express = require("express");

const router = express.Router();

const { authFor } = require("../../middlewares/auth.guard");

const Controller = require("./UserController");

const validation = require("./user.validations");

const validationHandler = require("../../middlewares/validationHandler");

const fileUpload = require("express-fileupload");

router.get("/", authFor("read:users"), Controller.users);

router.get("/:id", authFor("show:users"), validation.getUser, validationHandler, Controller.user);

router.post("/", authFor("create:users"), fileUpload(), validation.create, validationHandler, Controller.create);

router.put("/:id", authFor("edit:users"), fileUpload(), validation.update, validationHandler, Controller.update);

router.put(
	"/:id/change-activation",
	authFor("active:users"),
	validation.changeActivation,
	validationHandler,
	Controller.changeActivation
);

router.put("/:id/change-image", authFor("edit:users"), fileUpload(), Controller.changeImage);

router.delete("/:id", authFor("delete:users"), validation.delete, validationHandler, Controller.delete);

module.exports = router;
