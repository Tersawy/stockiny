const express = require("express");

const router = express.Router();

const { authFor, authForAny, isAuth } = require("../../middlewares/auth.guard");

const Controller = require("./ProductController");

const validation = require("./product.validations");

const validationHandler = require("../../middlewares/validationHandler");

const fileUpload = require("express-fileupload");

router.get("/", authFor("read:products"), Controller.products);

router.get("/:id/edit", authFor("edit:products"), validation.getEdit, validationHandler, Controller.getEdit);

router.get("/options", isAuth, validation.getOptions, validationHandler, Controller.getOptions);

router.get("/:id", authForAny("show:products"), Controller.product);

router.post("/", authFor("create:products"), fileUpload(), validation.create, validationHandler, Controller.create);

router.put("/:id", authFor("edit:products"), validation.update, validationHandler, Controller.update);

router.delete("/:id", authFor("delete:products"), validation.delete, validationHandler, Controller.delete);

router.post("/:id/change-availability", authForAny("edit:products"), validation.changeAvailability, validationHandler, Controller.changeAvailability);

router.put("/:id/change-image", authForAny("edit:products"), validation.changeImage, validationHandler, Controller.changeImage);

module.exports = router;
