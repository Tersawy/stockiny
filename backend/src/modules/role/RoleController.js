const Role = require("./Role");

const { notFound } = require("../../errors/ErrorHandler");

exports.getRoles = async (req, res) => {
	let query = Role.find({}, "name createdAt updatedAt createdBy updatedBy")
		.populate({ path: "createdBy", select: "username" })
		.populate({ path: "updatedBy", select: "username" })
		.withPagination(req.query)
		.withSearch(req.query);

	let counts = Role.count().withSearch(req.query);

	let [docs, total] = await Promise.all([query, counts]);

	docs = docs.map((doc) => {
		if (doc.updatedAt.getTime() - doc.createdAt.getTime() === 0) {
			doc.updatedAt = null;
		}

		return doc;
	});

	res.json({ docs, total });
};

exports.getOptions = async (req, res) => {
	let roles = await Role.find({}, "name");

	res.json({ options: roles });
};

exports.getRole = async (req, res) => {
	let role = await Role.findById(req.params.id, "name permissions");

	if (!role) throw notFound();

	res.json({ doc: role });
};

exports.createRole = async (req, res) => {
	let { name, permissions } = req.body;

	let role = await Role.findOne({ name }, "name");

	role && role.throwUniqueError({ name });

	role = new Role({ name, permissions, createdBy: req.me._id });

	await role.save();

	res.status(201).json({ message: "Role has been created successfully" });
};

exports.updateRole = async (req, res) => {
	let { name, permissions } = req.body;

	let role = await Role.findOne({ _id: { $ne: req.params.id }, name }, "name");

	role && role.throwUniqueError({ name });

	role = await Role.updateOne({ _id: req.params.id }, { name, permissions, updatedBy: req.me._id });

	if (!role.modifiedCount) throw notFound();

	res.status(200).json({ message: "Role has been updated successfully" });
};

exports.deleteRole = async (req, res) => {
	let del = await Role.deleteOne({ _id: req.params.id });

	if (!del.deletedCount) throw notFound();

	res.status(200).json({ message: "Role has been deleted successfully" });
};

// exports.isRole = async (role) => {
// 	try {
// 		let roleDoc = await Role.findOne({ name: role });

// 		return !!roleDoc;
// 	} catch (error) {
// 		throw error;
// 	}
// };

// exports.getRole = async (role) => {
// 	try {
// 		let roleDoc = await Role.findById(role);

// 		return roleDoc;
// 	} catch (error) {
// 		throw error;
// 	}
// };

// exports.getPermissions = async (role) => {
// 	try {
// 		let roleDoc = await Role.findById(role).populate({ path: "permissions", select: "_id" });

// 		return roleDoc ? roleDoc.permissions : [];
// 	} catch (error) {
// 		throw error;
// 	}
// };

// exports.createRole = async (role) => {
// 	try {
// 		if (!role) return [false, "Role is required"];

// 		if (!role.name) return [false, "Role name is required"];

// 		if (!role.permissions || !Array.isArray(role.permissions) || !role.permissions.length) {
// 			return [false, "Role permissions are required"];
// 		}

// 		let roleDoc = await Role.findById(role.name);

// 		if (roleDoc) return [false, "Role already exists"];

// 		let [success, error, invalidPermissions] = await PermissionController.areValidPermissions(role.permissions);

// 		if (!success) return [false, error, invalidPermissions];

// 		roleDoc = new Role({ name: role.name, permissions: role.permissions });

// 		await roleDoc.save();

// 		return [true, "Role created successfully", roleDoc];
// 	} catch (error) {
// 		throw error;
// 	}
// };

// exports.updateRole = async (role) => {
// 	try {
// 		if (!role) return [false, "Role is required"];

// 		if (!role.name) return [false, "Role name is required"];

// 		if (!role.permissions || !Array.isArray(role.permissions) || !role.permissions.length) {
// 			return [false, "Role permissions are required"];
// 		}

// 		let roleDoc = await Role.findById({ _id: role._id });

// 		if (!roleDoc) return [false, "Role does not exist"];

// 		let [success, error, invalidPermissions] = await PermissionController.areValidPermissions(role.permissions);

// 		if (!success) return [false, error, invalidPermissions];

// 		roleDoc.name = role.name;

// 		roleDoc.permissions = role.permissions;

// 		await roleDoc.save();

// 		return [true, roleDoc];
// 	} catch (error) {
// 		throw error;
// 	}
// };

// exports.deleteRole = async (roleId) => {
// 	try {
// 		if (!roleId) return [false, "Role is required"];

// 		let roleDoc = await Role.findOne({ _id: roleId });

// 		if (!roleDoc) return [false, "Role does not exist"];

// 		await Role.deleteOne({ _id: roleId });

// 		return [true, "Role deleted successfully"];
// 	} catch (error) {
// 		throw error;
// 	}
// };
