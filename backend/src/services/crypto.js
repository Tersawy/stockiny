const crypto = require("crypto");

module.exports = {
	randomToken: async (size) => {
		return new Promise((resolve, reject) => {
			crypto.randomBytes(size, (err, buffer) => {
				if (err) return reject(err);

				resolve(buffer.toString("hex"));
			});
		});
	},
};
