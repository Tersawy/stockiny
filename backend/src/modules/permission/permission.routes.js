const express = require("express");

const router = express.Router();

const { authFor } = require("../../middlewares/auth.guard");

const Controller = require("./PermissionController");

router.get("/", authFor("create:users"), Controller.getPermissions);

module.exports = router;
