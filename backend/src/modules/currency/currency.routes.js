const express = require("express");

const router = express.Router();

const { authFor } = require("../../middlewares/auth.guard");

const Controller = require("./CurrencyController");

const validation = require("./currency.validations");

const validationHandler = require("../../middlewares/validationHandler");

router.get("/", authFor("read:currencies"), Controller.currencies);

router.post("/", authFor("create:currencies"), validation.create, validationHandler, Controller.create);

router.put("/:id", authFor("edit:currencies"), validation.update, validationHandler, Controller.update);

router.delete("/:id", authFor("delete:currencies"), validation.delete, validationHandler, Controller.delete);

module.exports = router;
