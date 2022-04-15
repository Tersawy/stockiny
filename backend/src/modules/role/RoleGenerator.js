const { readFileSync, existsSync } = require("fs");

const { join } = require("path");

const consoleColors = require("../../utils/consoleColors");

const Permission = require("../permission/Permission");

const Role = require("./Role");

let generate = async () => {
	try {
		let appPermissions = await Permission.find();

		let roles = [];

		if (existsSync) {
			roles = readFileSync(join(__dirname, "../../config/roles.config.json"), "utf8");

			roles = JSON.parse(roles);
		}

		roles = roles.map((role) => {
			let permissions = [];

			if (role.permissions && Array.isArray(role.permissions)) {
				permissions = role.permissions.reduce((acc, permission) => {
					if (permission.split(":")[1] == "*") {
						let appPerms = appPermissions.filter(
							(appPermission) => appPermission._id.split(":")[0] == permission.split(":")[0]
						);

						return [...acc, ...appPerms.map((perm) => perm._id)];
					}

					let appPerm = appPermissions.find((appPermission) => appPermission._id == permission);

					if (appPerm) return [...acc, appPerm._id];

					return acc;
				}, []);
			}

			return { name: role.name, permissions };
		});

		await Role.deleteMany({});

		await Role.insertMany(roles);

		consoleColors("green", "** Roles generated successfully √ **");
	} catch (error) {
		consoleColors("red", "** ERROR IN: Roles generator √ **");
		console.log(error);
	}
};

module.exports = generate;
