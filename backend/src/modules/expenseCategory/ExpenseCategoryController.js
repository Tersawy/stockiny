const ExpenseCategory = require("./ExpenseCategory");

const { notFound } = require("../../errors/ErrorHandler");

exports.expenseCategories = async (req, res) => {
	let select = "name description";

	let query = ExpenseCategory.find({}, select).withPagination(req.query).withSearch(req.query);

	let counts = ExpenseCategory.count().withSearch(req.query);

	let [docs, total] = await Promise.all([query, counts]);

	res.json({ docs, total });
};

exports.options = async (req, res) => {
	let options = await ExpenseCategory.find({}, "name");

	res.json({ options });
};

exports.create = async (req, res) => {
	const { name, description } = req.body;

	let expenseCategory = await ExpenseCategory.findOne({ name });

	expenseCategory && expenseCategory.throwUniqueError({ name });

	expenseCategory = new ExpenseCategory({ name, description, createdBy: req.me._id });

	await expenseCategory.save();

	res.status(201).json({ message: "Expense Category has been created successfully" });
};

exports.update = async (req, res) => {
	const { name, description } = req.body;

	const { id } = req.params;

	let expenseCategory = await ExpenseCategory.findOne({ _id: { $ne: id }, name });

	expenseCategory && expenseCategory.throwUniqueError({ name });

	let update = await ExpenseCategory.updateOne({ _id: id }, { name, description, updatedBy: req.me._id });

	if (!update.matchedCount) throw notFound();

	res.json({ message: "Expense Category has been updated successfully" });
};

exports.delete = async (req, res) => {
	const { id } = req.params;

	let del = await ExpenseCategory.deleteById(id, req.me._id);

	if (!del.matchedCount) throw notFound();

	del.modifiedCount && (await ExpenseCategory.incDel());

	res.json({ message: "Expense Category has been deleted successfully" });
};
