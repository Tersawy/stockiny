const Expense = require("./Expense");

const { notFound } = require("../../errors/ErrorHandler");

exports.expenses = async (req, res) => {
	let select = "amount details category warehouse date reference";

	let query = Expense.find({}, select)
		.withPagination(req.query)
		.withSearch(req.query)
		.populate("category warehouse", "name _id");

	let counts = Expense.count().withSearch(req.query);

	let [docs, total] = await Promise.all([query, counts]);

	res.json({ docs, total });
};

exports.create = async (req, res) => {
	const { amount, details, category, warehouse, date } = req.body;

	let expense = { amount, details, category, warehouse, date, createdBy: req.me._id };

	expense = new Expense(expense);

	await expense.save();

	res.status(201).json({ message: "Expense has been created successfully" });
};

exports.update = async (req, res) => {
	const { amount, details, category, warehouse, date } = req.body;

	const { id } = req.params;

	let expense = { amount, details, category, warehouse, date, updatedBy: req.me._id };

	let update = await Expense.updateOne({ _id: id }, expense);

	if (!update.matchedCount) throw notFound();

	res.json({ message: "Expense has been updated successfully" });
};

exports.delete = async (req, res) => {
	const { id } = req.params;

	let del = await Expense.deleteById(id, req.me._id);

	if (!del.matchedCount) throw notFound();

	del.modifiedCount && (await Expense.incDel());

	res.json({ message: "Expense has been deleted successfully" });
};
