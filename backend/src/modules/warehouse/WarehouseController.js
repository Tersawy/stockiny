const Warehouse = require("./Warehouse");

const { notFound } = require("../../errors/ErrorHandler");

exports.warehouses = async (req, res) => {
	let select = "name phone email country city address zipCode";

	let query = Warehouse.find({}, select).withPagination(req.query).withSearch(req.query);

	let counts = Warehouse.count().withSearch(req.query);

	let [docs, total] = await Promise.all([query, counts]);

	res.json({ docs, total });
};

exports.options = async (req, res) => {
	let options = await Warehouse.find({}, "name");

	res.json({ options });
};

exports.create = async (req, res) => {
	const { name, phone, email, country, city, address, zipCode } = req.body;

	let $or = [{ name }, { phone }, { email }];

	let warehouse = await Warehouse.findOne({ $or });

	warehouse && warehouse.throwUniqueError({ name, phone, email });

	warehouse = new Warehouse({ name, phone, email, country, city, address, zipCode, createdBy: req.me._id });

	await warehouse.save();

	res.status(201).json({ message: "Warehouse has been created successfully" });
};

exports.update = async (req, res) => {
	const { name, phone, email, country, city, address, zipCode } = req.body;

	const { id } = req.params;

	let $or = [{ name }, { phone }, { email }];

	let warehouse = await Warehouse.findOne({ _id: { $ne: id }, $or });

	warehouse && warehouse.throwUniqueError({ name, phone, email });

	let warehouseData = { name, phone, email, country, city, address, zipCode, updatedBy: req.me._id };

	let update = await Warehouse.updateOne({ _id: id }, warehouseData);

	if (!update.matchedCount) throw notFound();

	res.json({ message: "Warehouse has been updated successfully" });
};

exports.delete = async (req, res) => {
	const { id } = req.params;

	let del = await Warehouse.deleteById(id, req.me._id);

	if (!del.matchedCount) throw notFound();

	del.modifiedCount && (await Warehouse.incDel());

	res.json({ message: "Warehouse has been deleted successfully" });
};
