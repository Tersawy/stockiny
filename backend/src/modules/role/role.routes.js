const express = require("express");

const router = express.Router();

const { authFor, authForAny } = require("../../middlewares/auth.guard");

const Controller = require("./RoleController");

const validation = require("../role/role.validations");

const validationHandler = require("../../middlewares/validationHandler");

router.get("/", authFor("read:roles"), Controller.getRoles);

router.get("/options", authForAny("create:users", "update:users"), Controller.getOptions);

router.get("/:id", authForAny("show:roles", "create:users", "update:users"), Controller.getRole);

router.post("/", authFor("create:roles"), validation.create, validationHandler, Controller.createRole);

router.put("/:id", authFor("edit:roles"), validation.update, validationHandler, Controller.updateRole);

router.delete("/:id", authFor("delete:roles"), validation.delete, validationHandler, Controller.deleteRole);

module.exports = router;
