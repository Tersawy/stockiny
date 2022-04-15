const Supplier = require("./Supplier");

const { notFound } = require("../../errors/ErrorHandler");

exports.suppliers = async (req, res) => {
	let select = "name phone zipCode email country city address";

	let query = Supplier.find({}, select).withPagination(req.query).withSearch(req.query);

	let counts = Supplier.count().withSearch(req.query);

	let [docs, total] = await Promise.all([query, counts]);

	res.json({ docs, total });
};

exports.options = async (req, res) => {
	let options = await Supplier.find({}, "name");

	res.json({ options });
};

exports.create = async (req, res) => {
	const { name, phone, zipCode, email, country, city, address } = req.body;

	let $or = [{ name }, { phone }, { email }];

	let supplier = await Supplier.findOne({ $or });

	supplier && supplier.throwUniqueError({ name, phone, email });

	supplier = new Supplier({ name, phone, zipCode, email, country, city, address, createdBy: req.me._id });

	await supplier.save();

	res.status(201).json({ message: "Supplier has been created successfully" });
};

exports.update = async (req, res) => {
	const { name, phone, zipCode, email, country, city, address } = req.body;

	const { id } = req.params;

	let $or = [{ name }, { phone }, { email }];

	let supplier = await Supplier.findOne({ _id: { $ne: id }, $or });

	supplier && supplier.throwUniqueError({ name, phone, email });

	let supplierData = { name, phone, zipCode, email, country, city, address, updatedBy: req.me._id };

	let update = await Supplier.updateOne({ _id: id }, supplierData);

	if (!update.matchedCount) throw notFound();

	res.json({ message: "Supplier has been updated successfully" });
};

exports.delete = async (req, res) => {
	const { id } = req.params;

	let del = await Supplier.deleteById(id, req.me._id);

	if (!del.matchedCount) throw notFound();

	del.modifiedCount && (await Supplier.incDel());

	res.json({ message: "Supplier has been deleted successfully" });
};
