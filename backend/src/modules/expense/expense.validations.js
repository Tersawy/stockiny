const mongoose = require("mongoose");

const { checkSchema } = require("express-validator");

const Expense = require("./Expense");

const Warehouse = require("../warehouse/Warehouse");

const ExpenseCategory = require("../expenseCategory/ExpenseCategory");

let schema = Expense.schema.obj;

let create = {
	amount: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isFloat: {
			errorMessage: { type: "minValue", min: schema.amount.min }, // `amount must be at least ${schema.amount.min} digits long`
			options: { min: schema.amount.min },
		},
	},

	details: {
		in: "body",

		optional: true,

		isString: {
			errorMessage: { type: "string" },
		},

		toLowerCase: schema.details.lowercase,

		trim: schema.details.trim,

		isLength: {
			options: { max: schema.details.maxlength },
			errorMessage: { type: "max", max: schema.details.maxlength },
		},
	},

	category: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isMongoId: {
			errorMessage: { type: "mongoId" },
		},

		customSanitizer: {
			options: (v) => {
				return mongoose.Types.ObjectId.isValid(v) ? v : null;
			},
		},

		custom: {
			options: async (value) => {
				if (!value) throw { type: "mongoId", value: "Category" };

				let category = await ExpenseCategory.findById(value);

				if (!category) throw { type: "notFound", value: "Category" };
			},
		},
	},

	warehouse: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isMongoId: {
			errorMessage: { type: "mongoId" },
		},

		customSanitizer: {
			options: (v) => {
				return mongoose.Types.ObjectId.isValid(v) ? v : null;
			},
		},

		custom: {
			options: async (value) => {
				if (!value) throw { type: "mongoId", value: "Warehouse" };

				let warehouse = await Warehouse.findById(value);

				if (!warehouse) throw { type: "notFound", value: "Warehouse" };
			},
		},
	},

	date: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isDate: {
			errorMessage: { type: "invalid" },
		},
	},
};

exports.create = checkSchema(create);

exports.update = checkSchema({
	...create,

	id: {
		in: "params",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isMongoId: {
			errorMessage: { type: "mongoId" },
		},
	},
});

exports.delete = checkSchema({
	id: {
		in: "params",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isMongoId: {
			errorMessage: { type: "mongoId" },
		},
	},
});
