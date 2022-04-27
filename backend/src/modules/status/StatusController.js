const { notFound, createError, exists } = require("../../errors/ErrorHandler");

const Status = require("./Status");

exports.getStatuses = async (req, res) => {
    let statuses = await Status.find({ invoice: req.invoiceName }, "_id name color effected description").sort({ createdAt: -1 });

    res.json({ statuses });
};

exports.createStatus = async (req, res) => {
    let { name, color, description } = req.body;

    let statuses = await Status.find({ invoice: req.invoiceName });

    let status = new Status({ invoice: req.invoiceName, name, color, description, createdBy: req.me._id });

    if (statuses.length == 0) status.effected = true;

    let sameName = statuses.find(status => status.name === name);

    if (sameName) throw exists();

    await status.save();

    res.status(201).json({});
}

exports.updateStatus = async (req, res) => {
    let { name, color, description } = req.body;

    let data = { name, color, description, updatedBy: req.me._id, updatedAt: Date.now() };

    let updated = await Status.updateOne({ _id: req.params.id }, data);

    if (!updated.matchedCount) throw notFound();

    res.json({});
}

exports.changeEffectedStatus = async (req, res) => {
    const { id } = req.params;

    let statuses = await Status.find({ invoice: req.invoiceName });

    if (!statuses.length) throw notFound();

    status = statuses.find(status => status._id.toString() === id);

    if (!status) throw notFound();

    if (status.effected) return res.json({});

    let effectedStatus = statuses.find(status => status.effected);

    if (statuses.length === 1 || !effectedStatus) {
        status.effected = true;

        await status.save();

        return res.json({});
    }

    let oldEffectedStatus = JSON.parse(JSON.stringify(effectedStatus._doc));

    for (let key in effectedStatus) {
        if (["_id", "effected"].includes(key)) continue;

        effectedStatus.set(key, status.get(key));

        status.set(key, oldEffectedStatus[key]);
    }

    await Promise.all([status.save(), effectedStatus.save()]);

    res.json({});
}

exports.deleteStatus = async (req, res) => {
    let status = await Status.findOne({ _id: req.params.id });

    if (!status) throw notFound();

    if (status.effected) throw createError({ field: "_id", message: { type: "effected" } });

    await status.deleteById(req.me._id);

    res.json({});
}
