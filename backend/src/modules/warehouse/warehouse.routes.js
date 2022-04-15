const express = require("express");

const router = express.Router();

const { authFor, isAuth } = require("../../middlewares/auth.guard");

const Controller = require("./WarehouseController");

const validation = require("./warehouse.validations");

const validationHandler = require("../../middlewares/validationHandler");

router.get("/", authFor("read:warehouses"), Controller.warehouses);

router.get("/options", isAuth, Controller.options);

router.post("/", authFor("create:warehouses"), validation.create, validationHandler, Controller.create);

router.put("/:id", authFor("edit:warehouses"), validation.update, validationHandler, Controller.update);

router.delete("/:id", authFor("delete:warehouses"), validation.delete, validationHandler, Controller.delete);

module.exports = router;
