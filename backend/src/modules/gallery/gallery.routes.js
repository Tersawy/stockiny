const express = require("express");

const router = express.Router();

const { isAuth, authForAny } = require("../../middlewares/auth.guard");

const Controller = require("./GalleryController");

const validation = require("./gallery.validations");

const validationHandler = require("../../middlewares/validationHandler");

const fileUpload = require("express-fileupload");

router.use(isAuth);

router.get("/products/:productId", authForAny("update:products", "show:products"), Controller.getProductGallery);

router.put(
	"/products/:productId",
	authForAny("update:products", "show:products"),
	fileUpload(),
	Controller.uploadToProductGallery
);

router.post(
	"/products/:productId",
	authForAny("update:products", "show:products"),
	validation.deleteFromProductGallery,
	validationHandler,
	Controller.deleteFromProductGallery
);

module.exports = router;
