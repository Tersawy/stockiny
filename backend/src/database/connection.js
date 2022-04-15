let mongoose = require("mongoose");

const mongooseCounters = require("../plugins/mongooseCounters");

const mongoosePagination = require("../plugins/mongoosePagination");

const mongooseSearch = require("../plugins/mongooseSearch");

const mongoosethrowUniqueError = require("../plugins/mongoosethrowUniqueError");

const consoleColors = require("../utils/consoleColors");

if (!process.env.DB_URL) {
	consoleColors("red|blink", "** DB_URL is not set, please add it to .env file **");
	process.exit(1);
}

if (!process.env.DB_NAME) {
	consoleColors("red|blink", "** DB_NAME is not set, please add it to .env file **");
	process.exit(1);
}

mongoose.plugin(mongooseSearch);

mongoose.plugin(mongoosePagination);

mongoose.plugin(mongoosethrowUniqueError);

mongoose.plugin(mongooseCounters);

module.exports = () =>
	mongoose
		.connect(`${process.env.DB_URL}/${process.env.DB_NAME}`, { useNewUrlParser: true })
		.then(() => {
			consoleColors("white|bgMagenta", "** Connected To Database √ **");
		})
		.catch((err) => console.error(err));
