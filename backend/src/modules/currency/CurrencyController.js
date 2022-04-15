const Currency = require("./Currency");

const { notFound } = require("../../errors/ErrorHandler");

exports.currencies = async (req, res) => {
	let select = "name code symbol";

	let query = Currency.find({}, select).withPagination(req.query).withSearch(req.query);

	let counts = Currency.count().withSearch(req.query);

	let [docs, total] = await Promise.all([query, counts]);

	res.json({ docs, total });
};

exports.options = async (req, res) => {
	let options = await Currency.find({}, "code");

	res.json({ options });
};

exports.create = async (req, res) => {
	const { name, symbol, code } = req.body;

	let currency = await Currency.findOne({ $or: [{ name }, { code }, { symbol }] });

	currency && currency.throwUniqueError({ name, code, symbol });

	currency = new Currency({ name, code, symbol, createdBy: req.me._id });

	await currency.save();

	res.status(201).json({ message: "Currency has been created successfully" });
};

exports.update = async (req, res) => {
	const { name, symbol, code } = req.body;

	const { id } = req.params;

	let currency = await Currency.findOne({ _id: { $ne: id }, $or: [{ name }, { code }, { symbol }] });

	currency && currency.throwUniqueError({ name, code, symbol });

	let update = await Currency.updateOne({ _id: id }, { name, code, symbol, updatedBy: req.me._id });

	if (!update.matchedCount) throw notFound();

	res.json({ message: "Currency has been updated successfully" });
};

exports.delete = async (req, res) => {
	const { id } = req.params;

	let del = await Currency.deleteById(id, req.me._id);

	if (!del.matchedCount) throw notFound();

	del.modifiedCount && (await Currency.incDel());

	res.json({ message: "Currency has been deleted successfully" });
};
