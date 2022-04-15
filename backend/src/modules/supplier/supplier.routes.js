const express = require("express");

const router = express.Router();

const { authFor, isAuth } = require("../../middlewares/auth.guard");

const Controller = require("./SupplierController");

const validation = require("./supplier.validations");

const validationHandler = require("../../middlewares/validationHandler");

router.get("/", authFor("read:suppliers"), Controller.suppliers);

router.get("/options", isAuth, Controller.options);

router.post("/", authFor("create:suppliers"), validation.create, validationHandler, Controller.create);

router.put("/:id", authFor("edit:suppliers"), validation.update, validationHandler, Controller.update);

router.delete("/:id", authFor("delete:suppliers"), validation.delete, validationHandler, Controller.delete);

module.exports = router;
