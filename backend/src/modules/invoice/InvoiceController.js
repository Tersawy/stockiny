const Invoice = require("./Invoice");

exports.getInvoices = async (req, res) => {
	let select =
		"-_id name statuses._id statuses.name statuses.color statuses.description statuses.effected statuses.createdAt";

	let invoices = await Invoice.find({}, select);

	invoices.forEach((invoice) => {
		invoice.statuses.sort((a, b) => b.createdAt - a.createdAt);
	});

	res.json({ docs: invoices });
};

// exports.getStatus = async (req, res) => {
// 	let invoice = await Invoice.findOne({ name: req.invoiceName });

// 	if (!invoice) {
// 		invoice = new Invoice({ name: req.invoiceName });

// 		await invoice.save();
// 	}

// 	res.json({ docs: invoice.statuses });
// };

exports.getStatusOptions = async (req, res) => {
	let select = "-_id statuses._id statuses.name statuses.color statuses.effected";

	let invoice = await Invoice.findOne({ name: req.invoiceName }, select);

	if (!invoice) {
		invoice = new Invoice({ name: req.invoiceName });

		await invoice.save();
	}

	res.json({ options: invoice.statuses });
};

exports.createStatus = async (req, res) => {
	let { name, color, description } = req.body;

	let invoice = await Invoice.findOne({ name: req.invoiceName });

	invoice = invoice || new Invoice({ name: req.invoiceName });

	color = color ? { color } : {};

	invoice.addStatus({ name, ...color, description, createdBy: req.me._id });

	await invoice.save();

	res.status(201).json({});
};

exports.updateStatus = async (req, res) => {
	let { name, color, description } = req.body;

	let invoice = await Invoice.findOne({ name: req.invoiceName });

	invoice = invoice || new Invoice({ name: req.invoiceName });

	invoice.updateStatus({ _id: req.params.id, name, color, description, updatedBy: req.me._id });

	await invoice.save();

	res.json({});
};

exports.deleteStatus = async (req, res) => {
	let invoice = await Invoice.findOne({ name: req.invoiceName });

	invoice = invoice || new Invoice({ name: req.invoiceName });

	invoice.deleteStatus(req.params.id);

	await invoice.save();

	res.json({});
};

exports.changeEffectedStatus = async (req, res) => {
	let invoice = await Invoice.findOne({ name: req.invoiceName });

	invoice = invoice || new Invoice({ name: req.invoiceName });

	invoice.setStatusEffected(req.params.id, req.me._id);

	await invoice.save();

	res.json({});
};
