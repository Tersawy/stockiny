const express = require("express");

const router = express.Router();

const { authFor, isAuth } = require("../../middlewares/auth.guard");

const Controller = require("./CategoryController");

const validation = require("../category/category.validations");

const validationHandler = require("../../middlewares/validationHandler");

const fileUpload = require("express-fileupload");

router.get("/", authFor("read:categories"), Controller.categories);

router.get("/options", isAuth, Controller.options);

router.post("/", authFor("create:categories"), fileUpload(), validation.create, validationHandler, Controller.create);

router.put("/:id", authFor("edit:categories"), fileUpload(), validation.update, validationHandler, Controller.update);

router.put("/:id/change-image", authFor("edit:categories"), fileUpload(), Controller.changeImage);

router.delete("/:id", authFor("delete:categories"), validation.delete, validationHandler, Controller.delete);

module.exports = router;
