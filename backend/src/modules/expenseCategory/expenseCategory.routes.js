const express = require("express");

const router = express.Router();

const { authFor, authForAny } = require("../../middlewares/auth.guard");

const Controller = require("./ExpenseCategoryController");

const validation = require("./expenseCategory.validations");

const validationHandler = require("../../middlewares/validationHandler");

router.get("/", authFor("read:expenseCategories"), Controller.expenseCategories);

router.get("/options", authForAny("create:expenses", "update:expenses"), Controller.options);

router.post("/", authFor("create:expenseCategories"), validation.create, validationHandler, Controller.create);

router.put("/:id", authFor("edit:expenseCategories"), validation.update, validationHandler, Controller.update);

router.delete("/:id", authFor("delete:expenseCategories"), validation.delete, validationHandler, Controller.delete);

module.exports = router;
