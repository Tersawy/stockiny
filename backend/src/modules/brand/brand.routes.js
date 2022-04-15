const express = require("express");

const router = express.Router();

const { authFor, authForAny } = require("../../middlewares/auth.guard");

const Controller = require("./BrandController");

const validation = require("./brand.validations");

const validationHandler = require("../../middlewares/validationHandler");

const fileUpload = require("express-fileupload");

router.get("/", authFor("read:brands"), Controller.brands);

router.get("/options", authForAny("create:products", "update:products"), Controller.options);

router.post("/", authFor("create:brands"), fileUpload(), validation.create, validationHandler, Controller.create);

router.put("/:id", authFor("edit:brands"), fileUpload(), validation.update, validationHandler, Controller.update);

router.put("/:id/change-image", authFor("edit:brands"), fileUpload(), Controller.changeImage);

router.delete("/:id", authFor("delete:brands"), validation.delete, validationHandler, Controller.delete);

module.exports = router;
