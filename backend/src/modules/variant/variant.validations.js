const { checkSchema } = require("express-validator");

const { existsSync } = require("fs");

const Variant = require("./Variant");

let schema = Variant.schema.obj;

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

exports.create = checkSchema({
	productId: {
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

	name: {
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

		toLowerCase: schema.name.lowercase,

		trim: schema.name.trim,

		isLength: {
			options: { min: schema.name.minlength, max: schema.name.maxlength },
			errorMessage: { type: "between", min: schema.name.minlength, max: schema.name.maxlength },
		},
	},
});

exports.update = checkSchema({
	id: checkId,

	name: {
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

		toLowerCase: schema.name.lowercase,

		trim: schema.name.trim,

		isLength: {
			options: { min: schema.name.minlength, max: schema.name.maxlength },
			errorMessage: { type: "between", min: schema.name.minlength, max: schema.name.maxlength },
		},
	},
});

exports.stocks = checkSchema({ id: checkId });

exports.changeAvailability = checkSchema({ id: checkId });

exports.changeImages = checkSchema({
	id: checkId,

	productId: {
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

	images: {
		in: "body",

		customSanitizer: {
			options: (v, { req }) => {
				let { getImagesPath } = req.app.locals.config;

				let productPath = getImagesPath("products", req.body.productId);

				v = Array.isArray(v) ? v : [v];

				v = v.reduce((images, image) => {
					let isString = !!image && typeof image === "string";

					if (!isString) return images;

					let imageNamePattern = /^[0-9]+_[a-z0-9]+.(jpg|png|jpeg)$/gi;

					let isValid = imageNamePattern.test(image);

					if (!isValid) return images;

					let imagePath = `${productPath}/${image}`;

					if (!existsSync(imagePath)) return images;

					images.push(image);

					return images;
				}, []);

				return v;
			},
		},
	},
});

exports.changeDefaultImage = checkSchema({
	id: checkId,

	productId: {
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

	image: {
		in: "body",

		trim: true,

		customSanitizer: {
			options: (v, { req }) => {
				let isString = !!v && typeof v === "string";

				if (!isString) return "";

				let imageNamePattern = /^[0-9]+_[a-z0-9]+.(jpg|png|jpeg)$/gi;

				let isValid = imageNamePattern.test(v);

				if (!isValid) throw { type: "invalid" };

				let { getImagesPath } = req.app.locals.config;

				let productPath = getImagesPath("products", req.body.productId);

				let imagePath = `${productPath}/${v}`;

				if (!existsSync(imagePath)) throw { type: "notFound" };

				return v;
			},
		},
	},
});
