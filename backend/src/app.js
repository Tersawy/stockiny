const express = require("express");

require("express-async-errors");

const app = express();

const { join } = require("path");

const errorHandler = require("./middlewares/errorHandler");

const cors = require("cors");
const { checkSchema } = require("express-validator");
const validationHandler = require("./middlewares/validationHandler");

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.locals.config = {
	getPublicPath: (...paths) => join(__dirname, "..", "public", ...paths.map((p) => p.toString())),
	getImagesPath: (...paths) => app.locals.config.getPublicPath("images", ...paths.map((p) => p.toString())),
};

app.use("/api/v1", express.static(join(__dirname, "../public")));

let routes = {
	"": "auth",
	brands: "brand",
	categories: "category",
	currencies: "currency",
	customers: "customer",
	suppliers: "supplier",
	warehouses: "warehouse",
	users: "user",
	"expense-categories": "expenseCategory",
	expenses: "expense",
	units: "unit",
	products: "product",
	roles: "role",
	permissions: "permission",
	gallery: "gallery",
	invoices: "invoice",
	purchases: "purchase",
	sales: "sale",
};

for (let route in routes) {
	app.use("/api/v1/" + route, require(`./modules/${routes[route]}/${routes[route]}.routes`));
}

// app.use("/api/v1", require("./modules/auth/auth.routes"));
// app.use("/api/v1/brands", require("./modules/brand/brand.routes"));
// app.use("/api/v1/categories", require("./modules/category/category.routes"));
// app.use("/api/v1/currencies", require("./modules/currency/currency.routes"));
// app.use("/api/v1/customers", require("./modules/customer/customer.routes"));
// app.use("/api/v1/suppliers", require("./modules/supplier/supplier.routes"));
// app.use("/api/v1/warehouses", require("./modules/warehouse/warehouse.routes"));
// app.use("/api/v1/users", require("./modules/user/user.routes"));
// app.use("/api/v1/expense-categories", require("./modules/expenseCategory/expenseCategory.routes"));
// app.use("/api/v1/expenses", require("./modules/expense/expense.routes"));
// app.use("/api/v1/units", require("./modules/unit/unit.routes"));
// app.use("/api/v1/products", require("./modules/product/product.routes"));
// app.use("/api/v1/roles", require("./modules/role/role.routes"));
// app.use("/api/v1/permissions", require("./modules/permission/permission.routes"));
// app.use("/api/v1/gallery", require("./modules/gallery/gallery.routes"));
// app.use("/api/v1/invoices/", require("./modules/invoice/invoice.routes"));

app.post(
	"/test",
	checkSchema({
		image: {
			in: "body",

			customSanitizer: {
				options: (v) => {
					v = (v || "").toString();

					if (/^[a-z]+_[0-9]+.(jpg|png|jpeg)$/gi.test(v)) return v;

					return "";
				},
			},

			trim: true,
		},
	}),
	validationHandler,
	(req, res) => {
		console.log(req.body);
		res.json({ message: "ok" });
	}
);

app.use(errorHandler);

module.exports = app;
