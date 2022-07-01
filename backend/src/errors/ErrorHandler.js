class ErrorHandler extends Error {
	constructor(message = "Something went wrong", statusCode = 500) {
		message = typeof message == "object" ? message : { message };

		message = JSON.stringify(message, null, 2);

		super(message);

		this.statusCode = statusCode;
	}

	parse() {
		return JSON.parse(this.message);
	}
}

module.exports = {
	ErrorHandler,

	/**
		@param {Object | String} message e.g. "Something went wrong" | { message: "Something went wrong" }
		@param {Number} statusCode e.g. 500
	*/
	createError: (message, statusCode = 500) => new ErrorHandler(message, statusCode),

	notFound: (field = "_id", statusCode = 404) => new ErrorHandler({ field, message: { type: "notFound" } }, statusCode),

	exists: (field = "name") => new ErrorHandler({ field, message: { type: "exists" } }, 409),

	E: {
		HTTP_200_OK: 200,
		HTTP_201_CREATED: 201,
		HTTP_204_NO_CONTENT: 204,
		HTTP_400_BAD_REQUEST: 400,
		HTTP_401_UNAUTHORIZED: 401,
		HTTP_403_FORBIDDEN: 403,
		HTTP_404_NOT_FOUND: 404,
		HTTP_422_UNPROCESSABLE_ENTITY: 422,
		HTTP_500_INTERNAL_SERVER_ERROR: 500,
		HTTP_409_CONFLICT: 409,
	},
};
