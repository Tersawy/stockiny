const { readFileSync } = require("fs");

const { join } = require("path");

const consoleColors = require("../../utils/consoleColors");

const Permission = require("./Permission");

let generate = async () => {
	try {
		let permissionData = readFileSync(join(__dirname, "../../config/permissions.config.json"), "utf8");

		let permissions = JSON.parse(permissionData);

		let generatePermission = (module) => permissions.actions.map((action) => `${action}:${module}`);

		let additionalPermissionsForModules = permissions.additionalPermissionsForModules;

		additionalPermissionsForModules = Object.keys(additionalPermissionsForModules).reduce((curr, module) => {
			let actions = additionalPermissionsForModules[module];
			let perms = actions.map((action) => `${action}:${module}`);

			return [...curr, ...perms];
		}, []);

		let mergePermissions = (oldPermissions, module) => [...oldPermissions, ...generatePermission(module)];

		permissions = permissions.modules.reduce(mergePermissions, [
			...permissions.additionalPermissions,
			...additionalPermissionsForModules,
		]);

		permissions = permissions.map((permission) => ({ _id: permission }));

		await Permission.deleteMany({});

		await Permission.insertMany(permissions);

		// console.log("\x1b[32;1m%s\x1b[0m", "** Permissions generated successfully √ **");
		consoleColors("green", "** Permissions generated successfully √ **");
	} catch (error) {
		console.log(error);
	}
};

module.exports = generate;
