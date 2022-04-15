const jwt = require("jsonwebtoken");

const fs = require("fs");

const { createError } = require("../errors/ErrorHandler");

const privateKey = fs.readFileSync("jwtRS256.key", "utf8");

const publicKey = fs.readFileSync("jwtRS256.key.pub", "utf8");

const signOptions = { algorithm: "RS256", expiresIn: "8h" };

const verifyOptions = { algorithms: ["RS256"] };

module.exports = {
	sign(payload) {
		return new Promise((resolve, reject) => {
			jwt.sign(payload, privateKey, signOptions, (err, token) => {
				if (err) return reject(err);

				resolve(token);
			});
		});
	},

	verify(token) {
		return new Promise((resolve, reject) => {
			if (!token) return reject(createError("Unauthentication", 401));

			token = token.split(" ")[1];

			if (!token) return reject(createError("Unauthentication", 401));

			jwt.verify(token, publicKey, verifyOptions, (err, decoded) => {
				if (err) {
					if (err.name === "TokenExpiredError") {
						return reject(createError("Token expired", 401));
					}

					return reject(createError("Unauthentication", 401));
				}

				resolve(decoded);
			});
		});
	},
};
