const Customer = require("./Customer");

const { notFound } = require("../../errors/ErrorHandler");

exports.customers = async (req, res) => {
	let select = "name phone zipCode email country city address";

	let query = Customer.find({}, select).withPagination(req.query).withSearch(req.query);

	let counts = Customer.count().withSearch(req.query);

	let [docs, total] = await Promise.all([query, counts]);

	res.json({ docs, total });
};

exports.create = async (req, res) => {
	const { name, phone, zipCode, email, country, city, address } = req.body;

	let $or = [{ name: name.toLowerCase() }, { phone: phone.toLowerCase() }, { email: email.toLowerCase() }];

	let customer = await Customer.findOne({ $or });

	customer && customer.throwUniqueError({ name, phone, email });

	customer = new Customer({ name, phone, zipCode, email, country, city, address, createdBy: req.me._id });

	await customer.save();

	res.status(201).json({ message: "Customer has been created successfully" });
};

exports.options = async (req, res) => {
	let options = await Customer.find({}, "name");

	res.json({ options });
};

exports.update = async (req, res) => {
	const { name, phone, zipCode, email, country, city, address } = req.body;

	const { id } = req.params;

	let $or = [{ name }, { phone }, { email }];

	let customer = await Customer.findOne({ _id: { $ne: id }, $or });

	customer && customer.throwUniqueError({ name, phone, email });

	let customerData = { name, phone, zipCode, email, country, city, address, updatedBy: req.me._id };

	let update = await Customer.updateOne({ _id: id }, customerData);

	if (!update.matchedCount) throw notFound();

	res.json({ message: "Customer has been updated successfully" });
};

exports.delete = async (req, res) => {
	const { id } = req.params;

	let del = await Customer.deleteById(id, req.me._id);

	if (!del.matchedCount) throw notFound();

	del.modifiedCount && (await Customer.incDel());

	res.json({ message: "Customer has been deleted successfully" });
};
