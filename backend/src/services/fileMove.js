const { createError } = require("../errors/ErrorHandler");

const { randomChar } = require("../utils/functions");

const { existsSync, mkdirSync } = require("fs");

let defaultOptions = { type: "image", extentions: ["jpg", "jpeg", "png"], maxSize: 5 * 1024 * 1024, dir: "" };

module.exports = async (file, options = defaultOptions) => {
	let { type, extentions, maxSize, dir } = { ...defaultOptions, ...options };

	if (!file) throw createError({ field: type, message: { type: "required" } }, 400);

	if (!dir) throw createError(`${type} directory is required`, 500);

	let fileType = file.mimetype.split("/")[0];

	if (type !== fileType) throw createError(`${type} is not allowed`, 400);

	let fileExtention = file.mimetype.split("/")[1];

	if (!extentions.includes(fileExtention)) throw createError({ field: "image", message: { type: "invalid" } }, 400);

	if (file.size > maxSize) {
		throw createError({ field: "image", message: { type: "maxValue", max: `${maxSize / 1024 / 1024} MB` } }, 400);
	}

	let fileName = `${Date.now()}_${randomChar(8)}.${fileExtention}`;

	if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

	let filePath = `${dir}/${fileName}`;

	await file.mv(filePath);

	return fileName;
};
