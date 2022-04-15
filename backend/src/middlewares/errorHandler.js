const { ErrorHandler } = require("../errors/ErrorHandler");

const consoleColors = require("../utils/consoleColors");

module.exports = (err, req, res, next) => {
	if (err instanceof ErrorHandler) {
		return res.status(err.statusCode).json(err.parse());
	}

	consoleColors("green", `Route: ${req.originalUrl}`);

	let route = { ...req.route };

	delete route.stack;

	consoleColors("blue", "Router: ", route);

	consoleColors("yellow", "-".repeat(135));

	consoleColors("red", "Message", `** ${err.message} **`);

	consoleColors("yellow", "-".repeat(135));

	consoleColors("cyan", "Reason", `** ${err.reason} **`);

	consoleColors("yellow", "-".repeat(135));

	consoleColors("red", "Stack: ", `** ${err.stack} **`);

	consoleColors("yellow", "-".repeat(135));

	console.log("Full Error: ", err);

	consoleColors("blue", "-".repeat(150));
	consoleColors("blue", "-".repeat(150));

	return res.status(500).json({ message: "Internal server error" });
};
