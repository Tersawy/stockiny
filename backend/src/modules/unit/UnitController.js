const Unit = require("./Unit");

const { notFound } = require("../../errors/ErrorHandler");

exports.units = async (req, res) => {
	let select = "name shortName value operator base";

	let query = Unit.find({}, select)
		.withPagination(req.query)
		.withSearch(req.query)
		.populate({ path: "base", select: "name _id" });

	let counts = Unit.count().withSearch(req.query);

	let [docs, total] = await Promise.all([query, counts]);

	res.json({ docs, total });
};

exports.baseOptions = async (req, res) => {
	let units = await Unit.find({ base: null }, "name");

	res.json({ options: units });
};

exports.options = async (req, res) => {
	let { deleted } = req.query;

	deleted = deleted == "true" || deleted === true;

	let select = "name shortName value operator base";

	// let units = Unit.find({}, select);

	let units = await (deleted ? Unit.findWithDeleted({}, select) : Unit.find({}, select));

	let baseUnits = units.filter((unit) => !unit.base);

	baseUnits = baseUnits.map((unit) => {
		let subUnits = units.filter((subUnit) => subUnit.base && subUnit.base.toString() === unit._id.toString());

		subUnits.unshift(unit);

		return { ...unit._doc, subUnits };
	});

	/* Remove base value from main units and sub units */
	baseUnits.forEach((baseUnit) => {
		delete baseUnit.base;
		if (baseUnit.subUnits && baseUnit.subUnits.length) {
			baseUnit.subUnits.forEach((subUnit) => {
				delete subUnit._doc.base;
			});
		}
	});

	res.json({ options: baseUnits });
};

exports.create = async (req, res) => {
	const { name, shortName, value, operator, base } = req.body;

	let $or = [{ name }, { shortName }];

	let unit = await Unit.findOne({ $or, base: null });

	unit && unit.throwUniqueError({ name, shortName });

	unit = new Unit({ name, shortName, value, operator, base, createdBy: req.me._id });

	await unit.save();

	res.status(201).json({ message: "Unit has been created successfully" });
};

exports.update = async (req, res) => {
	const { name, shortName, value, operator, base } = req.body;

	const { id } = req.params;

	let $or = [{ name }, { shortName }];

	let unit = await Unit.findOne({ _id: { $ne: id }, $or, base: null });

	unit && unit.throwUniqueError({ name, shortName });

	let unitData = { name, shortName, value, operator, base, updatedBy: req.me._id };

	let update = await Unit.updateOne({ _id: id }, unitData);

	if (!update.matchedCount) throw notFound();

	res.json({ message: "Unit has been updated successfully" });
};

exports.delete = async (req, res) => {
	const { id } = req.params;

	let del = await Unit.deleteById(id, req.me._id);

	if (!del.matchedCount) throw notFound();

	del.modifiedCount && (await Unit.incDel());

	res.json({ message: "Unit has been deleted successfully" });
};
