const express = require("express");

const router = express.Router();

const { authFor } = require("../../middlewares/auth.guard");

const Controller = require("./ExpenseController");

const validation = require("./expense.validations");

const validationHandler = require("../../middlewares/validationHandler");

router.get("/", authFor("read:expenses"), Controller.expenses);

router.post("/", authFor("create:expenses"), validation.create, validationHandler, Controller.create);

router.put("/:id", authFor("edit:expenses"), validation.update, validationHandler, Controller.update);

router.delete("/:id", authFor("delete:expenses"), validation.delete, validationHandler, Controller.delete);

module.exports = router;
