const express = require("express");

const router = express.Router();

const { authFor, isAuth } = require("../../middlewares/auth.guard");

const Controller = require("./CustomerController");

const validation = require("./customer.validations");

const validationHandler = require("../../middlewares/validationHandler");

router.get("/", authFor("read:customers"), Controller.customers);

router.get("/options", isAuth, Controller.options);

router.post("/", authFor("create:customers"), validation.create, validationHandler, Controller.create);

router.put("/:id", authFor("edit:customers"), validation.update, validationHandler, Controller.update);

router.delete("/:id", authFor("delete:customers"), validation.delete, validationHandler, Controller.delete);

module.exports = router;
