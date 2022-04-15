const express = require("express");

const router = express.Router();

const Controller = require("./InvoiceController");

const validation = require("./invoice.validations");

const validationHandler = require("../../middlewares/validationHandler");

const { createError } = require("../../errors/ErrorHandler");

const { isAuth } = require("../../middlewares/auth.guard");

/* 
@invoiceName - name of the route param e.g. /invoices/:name => /invoices/sales, /invoices/purchases
@module - name of the permission module e.g. sales, purchases
*/
let invoices = [
	{ invoiceName: "purchases", module: "purchases" },
	{ invoiceName: "purchases-return", module: "purchasesReturn" },
	{ invoiceName: "sales", module: "sales" },
	{ invoiceName: "sales-return", module: "salesReturn" },
];

router.get("/", isAuth, Controller.getInvoices);

router.use((req, res, next) => {
	let invoiceName = req.originalUrl.split("/")[4];

	let invoice = invoices.find((invoice) => invoice.invoiceName == invoiceName);

	if (!invoice) return res.status(404).send("Not found");

	req.invoiceName = invoice.invoiceName;

	return next();
});

function guard(...permissions) {
	return (req, res, next) => {
		if (req.me.isOwner) return next();

		permissions = permissions.map((p) => `${p}:${req.module}`);

		if (req.me.hasPermissions(permissions)) return next();

		return next(createError("You don't have permission to access this page", 401));
	};
}

// router.get("/:invoiceName/statuses", isAuth, guard("read"), Controller.getStatus);

router.get("/:invoiceName/statuses/options", isAuth, Controller.getStatusOptions);

router.post(
	"/:invoiceName/statuses",
	isAuth,
	guard("create"),
	validation.createStatus,
	validationHandler,
	Controller.createStatus
);

router.put(
	"/:invoiceName/statuses/:id",
	isAuth,
	guard("edit"),
	validation.updateStatus,
	validationHandler,
	Controller.updateStatus
);

router.delete(
	"/:invoiceName/statuses/:id",
	isAuth,
	guard("delete"),
	validation.deleteStatus,
	validationHandler,
	Controller.deleteStatus
);

router.post(
	"/:invoiceName/statuses/:id/change-effected",
	isAuth,
	guard("changeEffectedStatus"),
	validation.changeEffectedStatus,
	validationHandler,
	Controller.changeEffectedStatus
);

module.exports = router;
