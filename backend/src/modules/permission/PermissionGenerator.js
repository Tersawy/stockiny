const { readFileSync } = require("fs");

const { join } = require("path");

const consoleColors = require("../../utils/consoleColors");

const Permission = require("./Permission");

let generate = async () => {
	try {
		let permissionData = readFileSync(join(__dirname, "../../config/permissions.config.json"), "utf8");

		permissionData = JSON.parse(permissionData);

		let permissions = [];

		for (let permission of permissionData) {
			for (let module of permission.modules) {
				for (let action of permission.actions) {
					permissions.push({ _id: `${action}:${module}` });
				}
			}
		}

		await Permission.deleteMany({});

		await Permission.insertMany(permissions);

		consoleColors("green", "** Permissions generated successfully √ **");
	} catch (error) {
		console.log(error);
	}
};

module.exports = generate;
