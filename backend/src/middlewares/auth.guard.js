const { createError } = require("../errors/ErrorHandler");

const { verify } = require("../services/jwt");

const User = require("../modules/user/User");

const auth = async (req) => {
	try {
		let decoded = await verify(req.headers.authorization);

		let user = await User.findById(decoded.userId).onlyActive().withPermissions();

		if (!user) return null;

		user.mergePermissions();

		req.me = user;

		return user;
	} catch (_e) {
		return null;
	}
};

const isAuth = async (req, res, next) => {
	let user = await auth(req);

	if (!user) return next(createError("You don't have permission to access this page", 401));

	next();
};

const authFor = (...permissions) => {
	return async (req, res, next) => {
		let user = req.me || (await auth(req));

		if (!user) return next(createError("You don't have permission to access this page", 401));

		if (user.hasPermissions(permissions)) return next();

		next(createError("You don't have permission to access this page", 403));
	};
};

const authForAny = (...permissions) => {
	return async (req, res, next) => {
		let user = req.me || (await auth(req));

		if (!user) return next(createError("You don't have permission to access this page", 401));

		if (user.hasAnyPermission(permissions)) return next();

		next(createError("You don't have permission to access this page", 403));
	};
};

module.exports = { isAuth, authFor, authForAny };
