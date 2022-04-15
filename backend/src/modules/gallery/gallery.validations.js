const { checkSchema } = require("express-validator");

const { existsSync } = require("fs");

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

exports.deleteFromProductGallery = checkSchema({
	productId: checkId,

	images: {
		in: "body",

		customSanitizer: {
			options: (v, { req }) => {
				let { getImagesPath } = req.app.locals.config;

				let productPath = getImagesPath("products", req.params.productId);

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

				req.body.imagesPath = v.map((image) => `${productPath}/${image}`);

				return v;
			},
		},
	},
});
