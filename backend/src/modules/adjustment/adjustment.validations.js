const mongoose = require("mongoose");

const schema = require("./schemas/AdjustmentSchema").obj;

const detailSchema = require("./schemas/DetailSchema").obj;

const { checkSchema } = require("express-validator");

let createAdjustment = {
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
		}
	},

	details: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},
	},

	"details.*.quantity": {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isFloat: {
			errorMessage: { type: "minValue", gt: 0 },
			options: { gt: 0 },
		},
	},

	"details.*.variant": {
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
	},

	"details.*.product": {
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
	},

	"details.*.subUnit": {
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
	},

	"details.*.type": {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isString: {
			errorMessage: { type: "string" },
		},

		toLowerCase: detailSchema.type.lowercase,

		trim: detailSchema.type.trim,

		custom: {
			options: (value) => detailSchema.type.enum.includes(value),
			errorMessage: { type: "enum", values: detailSchema.type.enum }, // "type must be either 'subtraction' or 'addition'"
		},
	},

	status: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isMongoId: {
			errorMessage: { type: "mongoId" },
		}
	},

	notes: {
		in: "body",

		optional: true,

		isString: {
			errorMessage: { type: "string" },
		},

		toLowerCase: schema.notes.lowercase,

		trim: schema.notes.trim,

		optional: { options: { nullable: true } },

		isLength: {
			options: { max: schema.notes.maxlength },
			errorMessage: { type: "max", max: schema.notes.maxlength },
		},
	},
};

let checkId = {
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
};

let updateAdjustment = { ...createAdjustment, id: checkId };

exports.getAdjustments = checkSchema({
	date: { in: "query", toDate: true },

	warehouse: { in: "query", customSanitizer: { options: (v) => mongoose.Types.ObjectId.isValid(v) ? v : null } },

	status: { in: "query", customSanitizer: { options: (v) => mongoose.Types.ObjectId.isValid(v) ? v : null } },
});

exports.createAdjustment = checkSchema(createAdjustment);

exports.getAdjustment = checkSchema({ id: checkId });

exports.getEditAdjustment = checkSchema({ id: checkId });

exports.deleteAdjustment = checkSchema({ id: checkId });

exports.updateAdjustment = checkSchema(updateAdjustment);

exports.changeAdjustmentStatus = checkSchema({
	id: checkId,

	statusId: {
		in: "body",

		exists: {
			errorMessage: { type: "required" },
		},

		notEmpty: {
			errorMessage: { type: "required" },
		},

		isMongoId: {
			errorMessage: { type: "mongoId" },
		}
	}
});
