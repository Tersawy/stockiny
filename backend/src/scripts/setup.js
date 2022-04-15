require("dotenv").config();

const connection = require("../database/connection");

const PermissionGenerator = require("../modules/permission/PermissionGenerator");

const RoleGenerator = require("../modules/role/RoleGenerator");

(async function () {
	"use strict";

	await connection();

	await PermissionGenerator();

	await RoleGenerator();

	process.exit(1);
})();
