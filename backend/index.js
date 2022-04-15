require("dotenv").config();

let connection = require("./src/database/connection");

const consoleColors = require("./src/utils/consoleColors");

connection().then(async () => {
	const app = require("./src/app");

	const server = require("http").createServer(app);

	let PORT = process.env.PORT || 3000;

	server.listen(PORT, () => consoleColors("yellow", `** Server is running on port ${PORT} **`));

	require("./dev");
});

// let bin = "402145";

// let cardLength = 14;

// let restOfLength = cardLength - bin.length;

// console.log(restOfLength);

// 10 ** 10 = 1 000 000 000 000
