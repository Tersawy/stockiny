const express = require("express");

const router = express.Router();

const { authFor, isAuth } = require("../../middlewares/auth.guard");

const Controller = require("./UnitController");

const validation = require("./unit.validations");

const validationHandler = require("../../middlewares/validationHandler");

router.get("/", authFor("read:units"), Controller.units);

router.get("/options", isAuth, Controller.options);

router.get("/base-options", authFor("create:units"), Controller.baseOptions);

router.post("/", authFor("create:units"), validation.create, validationHandler, Controller.create);

router.put("/:id", authFor("edit:units"), validation.update, validationHandler, Controller.update);

router.delete("/:id", authFor("delete:units"), validation.delete, validationHandler, Controller.delete);

module.exports = router;
