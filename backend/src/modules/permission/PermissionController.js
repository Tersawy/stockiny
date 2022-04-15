const Permission = require("./Permission");

exports.getPermissions = async (req, res) => {
	let $regex = new RegExp(/^(?!forceDelete)(?!restore)(?!trash)/, "i");

	let permissions = await Permission.find({ _id: { $regex } }, "_id");

	permissions = permissions.map((permission) => permission._id);

	res.status(200).json({ docs: permissions, total: permissions.length });
};

// exports.getPermissionNames = async () => {
// 	try {
// 		let permissions = await Permission.find({}, { _id: 1 });

// 		if (!permissions || !permissions.length) {
// 			consoleColors("red", "** Permissions are not found, please run `npm run setup` first **");
// 			process.exit(1);
// 		}

// 		return permissions.map((permission) => permission._id);
// 	} catch (error) {
// 		throw error;
// 	}
// };

// exports.isPermission = async (permission) => {
// 	try {
// 		permission = await Permission.findById(permission);

// 		return !!permission;
// 	} catch (error) {
// 		throw error;
// 	}
// };

// exports.userHasPermission = async (user, permission) => {
// 	try {
// 		let userPermissions = user && user.permissions && Array.isArray(user.permissions) ? user.permissions : [];

// 		let rolePermissions = await RoleController.getPermissions(user.role);

// 		rolePermissions = rolePermissions.map((permission) => permission.name);

// 		let allPermissions = [...new Set([...userPermissions, ...rolePermissions])];

// 		if (allPermissions.includes(permission)) return true;

// 		return false;
// 	} catch (error) {
// 		throw error;
// 	}
// };

// exports.areValidPermissions = async (permissions) => {
// 	try {
// 		let isValid = permissions && Array.isArray(permissions) && permissions.length;

// 		if (!isValid) return [false, "Permissions are required"];

// 		let permissionDocs = await Permission.find({ name: { $in: permissions } });

// 		let invalidPermissions = [];

// 		let areValid = permissions.every((permission) => {
// 			let permissionDoc = permissionDocs.find((permissionDoc) => permissionDoc.name === permission);

// 			if (!permissionDoc) invalidPermissions.push(permission);

// 			return !!permissionDoc;
// 		});

// 		if (!areValid) return [false, "Invalid permissions", invalidPermissions];

// 		return [true];
// 	} catch (error) {
// 		throw error;
// 	}
// };
